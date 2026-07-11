// screenAbstract.mjs
// Screens a research abstract against a caller-supplied list of
// inclusion/exclusion criteria and returns a structured decision.
//
// Responsible-AI guarantees:
//   * Decisions use ONLY the criteria passed in (no invented criteria).
//   * Every call is logged with: tool name, requested + resolved model
//     version, exact prompt, response, and timing (audit trail).

import OpenAI from "openai";
import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { configDotenv } from "dotenv";

configDotenv();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// -- Step 3: force the model into a fixed shape via a strict JSON schema ------
const DECISION_SCHEMA = {
  name: "screening_decision",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      decision: { type: "string", enum: ["include", "exclude", "uncertain"] },
      reason: { type: "string", description: "One sentence explaining the decision." },
      criterion_id: {
        type: ["string", "null"],
        description: "Id of the single criterion most responsible for the decision, or null."
      }
    },
    required: ["decision", "reason", "criterion_id"]
  }
};

// -- Step 4: build a prompt that hard-constrains the model to the input -------
function buildMessages(abstract, criteria) {
  const criteriaBlock = criteria
    .map((c) => `- [${c.id}] (${c.type}) ${c.text}`)
    .join("\n");

  const system = [
    "You are a systematic-review screening assistant.",
    "Decide whether a research abstract should be INCLUDED, EXCLUDED, or marked UNCERTAIN,",
    "based ONLY on the inclusion/exclusion criteria provided in the user message.",
    "",
    "Hard rules:",
    "1. Use ONLY the listed criteria. Never invent, infer, or apply a criterion that is not written in the list.",
    '2. If the abstract lacks the information needed to judge a relevant criterion, choose "uncertain".',
    '3. Choose "exclude" if the abstract clearly meets an exclusion criterion OR clearly fails a required inclusion criterion.',
    '4. Choose "include" only if the inclusion criteria are satisfied and no exclusion criterion is met.',
    '5. In "criterion_id", return the id of the single criterion that most drove the decision, exactly as given, or null.',
    '6. "reason" must be one sentence and may reference only the provided criteria.'
  ].join("\n");

  const user = [
    "INCLUSION/EXCLUSION CRITERIA:",
    criteriaBlock,
    "",
    "ABSTRACT:",
    abstract.trim()
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
}

// -- Step 6: default audit logger (one JSON object per line) ------------------
async function defaultLogger(record) {
  await appendFile("ai-audit.log.jsonl", JSON.stringify(record) + "\n", "utf8");
}

// -- Main function -----------------------------------------------------------
export async function screenAbstract({
  abstract,
  criteria,
  model = "gpt-4o-2024-08-06",
  logger = defaultLogger
}) {
  // Step 1: validate + normalize input
  if (typeof abstract !== "string" || abstract.trim() === "") {
    throw new Error("`abstract` must be a non-empty string.");
  }
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new Error("`criteria` must be a non-empty array.");
  }

  const normalized = criteria.map((c, i) => ({
    id: c.id ?? `C${i + 1}`,
    type: (c.type ?? "inclusion").toLowerCase(),
    text: String(c.text ?? c).trim()
  }));
  const allowedIds = new Set(normalized.map((c) => c.id));

  const messages = buildMessages(abstract, normalized);

  // Step 5: call the API deterministically with structured output
  const requestedAt = new Date().toISOString();
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    messages,
    response_format: { type: "json_schema", json_schema: DECISION_SCHEMA }
  });

  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch {
    parsed = {
      decision: "uncertain",
      reason: "Model returned unparseable output; flagged for human review.",
      criterion_id: null
    };
  }

  // Anti-hallucination guard: reject any criterion id we never supplied.
  if (parsed.criterion_id !== null && !allowedIds.has(parsed.criterion_id)) {
    parsed = {
      decision: "uncertain",
      reason: "Model cited a criterion not in the provided list; flagged for human review.",
      criterion_id: null
    };
  }

  // Step 6: build + write the audit record
  const auditRecord = {
    call_id: randomUUID(),
    tool: "openai.chat.completions",
    model_requested: model,
    model_resolved: completion.model, // exact version, e.g. gpt-4o-2024-08-06
    system_fingerprint: completion.system_fingerprint ?? null,
    requested_at: requestedAt,
    responded_at: new Date().toISOString(),
    prompt: messages, // the exact prompt sent
    response: parsed,
    usage: completion.usage ?? null
  };
  await logger(auditRecord);

  return { ...parsed, audit: auditRecord };
}

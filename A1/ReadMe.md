# A1 — Abstract Screening Assistant

**Track 3 · AI Integration**

A Node.js function that takes a research abstract and a list of inclusion/exclusion criteria, calls the OpenAI API, and returns a structured screening decision — `include`, `exclude`, or `uncertain` — with a one-sentence reason.

## Design highlights

- **No invented criteria.** The model is instructed to use only the criteria passed in, and an application-layer guard rejects any `criterion_id` the model returns that was not in the supplied list, downgrading those cases to `uncertain` for human review. Prompt instructions alone aren't a guarantee, so the guard is the part that's actually enforced.
- **Structured output.** The call uses a strict JSON schema, so `decision` can only ever be one of the three allowed values — no free-text parsing.
- **Deterministic.** `temperature: 0` so the same abstract and criteria yield the same decision, which matters for a reproducible screening pipeline and for anyone re-running the audit.
- **Responsible-AI logging.** Every call is appended to `ai-audit.log.jsonl` with the tool name, the requested and the resolved model version, the exact prompt sent, timestamps, and token usage — matching Sabi Core's requirement to record which tool, version, and prompt was used, and where.

## Run

```bash
npm install
```

Create `.env`:

```
OPENAI_API_KEY=sk-proj-...your key...
```

Then:

```bash
npm start        # screens the sample abstract in run.mjs and prints the decision
npm run dev      # same, re-running automatically on save (nodemon)
```

Edit the `abstract` and `criteria` at the top of `run.mjs` to screen your own content. To use a different model, pass it in: `screenAbstract({ abstract, criteria, model: "gpt-4o-mini" })`.

## Files

- `screenAbstract.mjs` — the screening function and audit logger
- `run.mjs` — a small driver with a sample abstract and criteria
- `ai-audit.log.jsonl` — append-only audit trail (created on first run)

## Notes

- Files use `.mjs`, so they run as ES modules regardless of the `type` field in `package.json`.
- `429 insufficient_quota` means the OpenAI account has no credit — add funds under Billing. `401` means the key is wrong or picked up a stray space/newline.

## What I'd improve with more time

I'd add automated tests around the anti-hallucination guard and the `uncertain` fallbacks (including malformed model output), and add retry-with-backoff so transient `429`/`5xx` responses don't fail a whole batch. I'd also swap the file-based logger for a proper persistence layer (Postgres via Prisma, matching the rest of the stack) so the audit trail is queryable, and add a batch runner that screens a folder of abstracts and writes a CSV of decisions alongside the log.
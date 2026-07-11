// run.mjs — a small driver that calls screenAbstract once and prints the result.
import { screenAbstract } from "./screenAbstract.mjs";

const abstract = `
This double-blind randomised controlled trial enrolled 240 adults (aged 18-65)
with type 2 diabetes to compare a low-carbohydrate diet against standard care
over 12 months. The primary outcome was change in HbA1c.
`;

const criteria = [
  { id: "C1", type: "inclusion", text: "Randomised controlled trial" },
  { id: "C2", type: "inclusion", text: "Adult participants (18+)" },
  { id: "C3", type: "inclusion", text: "Studies type 2 diabetes" },
  { id: "C4", type: "exclusion", text: "Animal study" }
];

const result = await screenAbstract({ abstract, criteria });

console.log("\n=== DECISION ===");
console.log("Decision   :", result.decision);
console.log("Reason     :", result.reason);
console.log("Criterion  :", result.criterion_id);
console.log("Model used :", result.audit.model_resolved);
console.log("\nFull audit record was appended to ai-audit.log.jsonl");

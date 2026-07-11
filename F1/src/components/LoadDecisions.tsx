import type { DecisionsMap, StoredDecision } from "../Types/general";

export function loadDecisions(storageKey: string): DecisionsMap {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    // Keep only well-formed entries so the DecisionsMap type is actually
    // guaranteed (guards against a corrupted / hand-edited value).
    const valid: StoredDecision[] = ["include", "exclude", "flag"];
    const out: DecisionsMap = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && (valid as string[]).includes(value)) {
        out[id] = value as StoredDecision;
      }
    }
    return out;
  } catch {
    return {};
  }
}
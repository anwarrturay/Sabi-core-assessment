import { useCallback, useEffect, useMemo, useState } from "react";
import type { Study, UseStudyDecisionsResult, DecisionsMap, DecisionStatus, ResolvedStudy, DecisionCounts} from "./Types/general";
import { loadDecisions } from "./components/LoadDecisions";
/**
 * useStudyDecisions
 * -----------------
 * Owns the reviewer's decisions and persists them to localStorage so they
 * survive a page refresh (an explicit requirement of F1).
 *
 * Design choices worth defending:
 *  - We persist ONLY the decisions map ({ [studyId]: status }), not the full
 *    study objects. The studies themselves are static input data; duplicating
 *    them into localStorage would waste space and risk the stored copy drifting
 *    out of sync with the source data.
 *  - Decisions are merged onto the base studies at read time, so the source
 *    JSON stays the single source of truth for title/abstract/authors/year.
 *  - Writes are wrapped in try/catch because localStorage can throw (private
 *    mode, quota exceeded). A screener should never crash because storage is
 *    unavailable — it just loses persistence, which we surface to the caller.
 */

/** The four decision states a reviewer can assign. */


export function useStudyDecisions(
  baseStudies: Study[],
  storageKey = "sabicore.f1.decisions.v1"
): UseStudyDecisionsResult {
  const [decisions, setDecisions] = useState<DecisionsMap>(() => loadDecisions(storageKey));
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Persist whenever decisions change.
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(decisions));
      setStorageAvailable(true);
    } catch {
      // Quota exceeded or storage disabled — keep working in-memory.
      setStorageAvailable(false);
    }
  }, [decisions, storageKey]);

  const setDecision = useCallback((studyId: string, status: DecisionStatus) => {
    setDecisions((prev) => {
      // "undecided" is the default, so we drop the key instead of storing it.
      if (status === "undecided") {
        const next = { ...prev };
        delete next[studyId];
        return next;
      }
      return { ...prev, [studyId]: status };
    });
  }, []);

  const resetAll = useCallback(() => setDecisions({}), []);

  // Merge persisted decisions onto the base studies.
  const studies = useMemo<ResolvedStudy[]>(
    () =>
      baseStudies.map((study) => ({
        ...study,
        status: decisions[study.id] ?? study.status ?? "undecided",
      })),
    [baseStudies, decisions]
  );

  // Progress counts for the header.
  const counts = useMemo<DecisionCounts>(() => {
    const c: DecisionCounts = {
      include: 0,
      exclude: 0,
      flag: 0,
      undecided: 0,
      total: studies.length,
      decided: 0,
    };
    for (const s of studies) c[s.status] += 1;
    c.decided = c.include + c.exclude + c.flag;
    return c;
  }, [studies]);

  return { studies, setDecision, resetAll, counts, storageAvailable };
}
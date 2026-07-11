import { type LucideIcon} from "lucide-react";

export interface DecisionMeta {
  label: string;
  key: string;
  Icon: LucideIcon;
  dot: string;
  pill: string;
  btnActive: string;
  btnHover: string;
}

export type DecisionStatus = "include" | "exclude" | "flag" | "undecided";

/** Only non-default decisions are persisted — "undecided" is dropped. */
export type StoredDecision = Exclude<DecisionStatus, "undecided">;

/** A study as supplied in the input JSON. `status` is a seed value only. */
export interface Study {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  status?: DecisionStatus;
}

export type Filter = DecisionStatus | "all";
/** A study after decisions are merged on — `status` is always resolved. */
export interface ResolvedStudy extends Study {
  status: DecisionStatus;
}

/** Map of studyId -> persisted decision. */
export type DecisionsMap = Record<string, StoredDecision>;

export interface DecisionCounts {
  include: number;
  exclude: number;
  flag: number;
  undecided: number;
  total: number;
  decided: number;
}

export interface UseStudyDecisionsResult {
  studies: ResolvedStudy[];
  setDecision: (studyId: string, status: DecisionStatus) => void;
  resetAll: () => void;
  counts: DecisionCounts;
  storageAvailable: boolean;
}

export interface StudyScreenerProps {
  studies: Study[];
}

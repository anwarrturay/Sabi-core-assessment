import type { Filter } from "../Types/general";
import { DECISIONS } from "../utils/Decisions";

export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

export const FILTERS: Filter[] = ["all", "undecided", "include", "exclude", "flag"];
export const filterLabel = (f: Filter): string =>
  f === "all" ? "All" : f === "undecided" ? "Undecided" : DECISIONS[f].label;

export function shortTitle(title: string, max = 60): string {
  return title.length > max ? title.slice(0, max).trimEnd() + "…" : title;
}
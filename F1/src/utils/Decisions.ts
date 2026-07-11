import { Check, X, Flag, CircleDot} from "lucide-react";
import type { DecisionMeta, DecisionStatus} from "../Types/general";


export const DECISIONS: Record<DecisionStatus, DecisionMeta> = {
  include: {
    label: "Include",
    key: "i",
    Icon: Check,
    dot: "bg-green-700",
    pill: "text-green-700 bg-green-50",
    btnActive: "border-green-700 bg-green-50 text-green-700 font-semibold",
    btnHover: "hover:border-green-700 hover:bg-green-50 hover:text-green-700",
  },
  exclude: {
    label: "Exclude",
    key: "e",
    Icon: X,
    dot: "bg-rose-700",
    pill: "text-rose-700 bg-rose-50",
    btnActive: "border-rose-700 bg-rose-50 text-rose-700 font-semibold",
    btnHover: "hover:border-rose-700 hover:bg-rose-50 hover:text-rose-700",
  },
  flag: {
    label: "Flag",
    key: "f",
    Icon: Flag,
    dot: "bg-amber-700",
    pill: "text-amber-700 bg-amber-50",
    btnActive: "border-amber-700 bg-amber-50 text-amber-700 font-semibold",
    btnHover: "hover:border-amber-700 hover:bg-amber-50 hover:text-amber-700",
  },
  undecided: {
    label: "Clear",
    key: "u",
    Icon: CircleDot,
    dot: "bg-slate-400",
    pill: "text-slate-400 bg-slate-100",
    btnActive: "border-slate-400 bg-slate-100 text-slate-500 font-semibold",
    btnHover: "hover:border-slate-400 hover:bg-slate-100 hover:text-slate-500",
  },
};

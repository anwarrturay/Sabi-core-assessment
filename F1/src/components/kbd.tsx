import type { ReactNode } from "react";


export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="font-mono text-[0.72rem] bg-slate-100 border border-slate-200 border-b-2 rounded px-1.5 py-px text-slate-500">
      {children}
    </kbd>
  );
}
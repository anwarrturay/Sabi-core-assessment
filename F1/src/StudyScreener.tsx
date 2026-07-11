import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { RotateCcw, Search, Keyboard } from "lucide-react";
import { useStudyDecisions,  } from "./useStudyDecisions";
import { DECISIONS } from "./utils/Decisions";
import { Kbd } from "./components/kbd";
import type { DecisionStatus, Filter, DecisionMeta, StudyScreenerProps } from "./Types/general";
import { cx, shortTitle, FILTERS, filterLabel } from "./components/excerpts";

export default function StudyScreener({ studies: baseStudies }: StudyScreenerProps) {
  const { studies, setDecision, resetAll, counts, storageAvailable } = useStudyDecisions(baseStudies);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(baseStudies[0]?.id ?? null);
  const [announcement, setAnnouncement] = useState("");

  const listRef = useRef<HTMLUListElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return studies.filter((s) => {
      const matchesStatus = filter === "all" || s.status === filter;
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.authors.join(", ").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [studies, query, filter]);

  useEffect(() => {
    if (visible.length === 0) return;
    if (!visible.some((s) => s.id === selectedId)) setSelectedId(visible[0].id);
  }, [visible, selectedId]);

  const selectedIndex = visible.findIndex((s) => s.id === selectedId);
  const selected = visible[selectedIndex] ?? null;


  function focusOption(id: string) {
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(`[data-study-id="${id}"]`)?.focus();
    });
  }

  function moveSelection(delta: number) {
    if (visible.length === 0) return;
    const current = selectedIndex === -1 ? 0 : selectedIndex;
    const next = Math.min(Math.max(current + delta, 0), visible.length - 1);
    const id = visible[next].id;
    setSelectedId(id);
    focusOption(id);
  }

  function jumpTo(index: number) {
    if (visible.length === 0) return;
    const id = visible[index].id;
    setSelectedId(id);
    focusOption(id);
  }

  function decide(status: DecisionStatus) {
    if (!selected) return;
    setDecision(selected.id, status);
    setAnnouncement(
      `${DECISIONS[status].label}: ${shortTitle(selected.title)}. Study ${selectedIndex + 1} of ${visible.length}.`
    );
  }

  // Listbox navigation: arrows / Home / End.
  function onListKeyDown(e: ReactKeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); moveSelection(1); break;
      case "ArrowUp": e.preventDefault(); moveSelection(-1); break;
      case "Home": e.preventDefault(); jumpTo(0); break;
      case "End": e.preventDefault(); jumpTo(visible.length - 1); break;
      default: break;
    }
  }

  // Decision shortcuts (i/e/f/u) work anywhere except while typing in search.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || Boolean(target?.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      const entries = Object.entries(DECISIONS) as [DecisionStatus, DecisionMeta][];
      const match = entries.find(([, d]) => d.key === e.key.toLowerCase());
      if (match) {
        e.preventDefault();
        decide(match[0]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, selectedIndex, visible.length]);

  const pct = counts.total ? Math.round((counts.decided / counts.total) * 100) : 0;
  const statuses: DecisionStatus[] = ["include", "exclude", "flag", "undecided"];

  return (
    <div className="mx-auto flex min-h-full max-w-[1200px] flex-col gap-3.5 p-5">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[1.7rem] leading-none text-teal-700" aria-hidden="true">◐</span>
          <div>
            <h1 className="m-0 text-xl font-semibold tracking-tight">Study screener</h1>
            <p className="m-0 text-[0.82rem] text-slate-500">Title &amp; abstract review</p>
          </div>
        </div>

        <div
          className="flex min-w-[180px] flex-1 items-center gap-2.5"
          aria-label={`${counts.decided} of ${counts.total} studies decided`}
        >
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-300">
            <div className="h-full rounded-full bg-teal-700 transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
          <span className="whitespace-nowrap text-[0.8rem] text-slate-500">
            {counts.decided}/{counts.total} decided
          </span>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.82rem] text-slate-500 hover:border-rose-700 hover:text-rose-700"
          onClick={() => {
            if (window.confirm("Clear all decisions? This cannot be undone.")) {
              resetAll();
              setAnnouncement("All decisions cleared.");
            }
          }}
        >
          <RotateCcw size={15} aria-hidden="true" />
          Reset
        </button>
      </header>

      {!storageAvailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800" role="status">
          Decisions can&apos;t be saved in this browser (storage is blocked or full). Your work will be lost on refresh.
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-500">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles or authors"
            aria-label="Search studies by title or author"
            className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by decision">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.82rem]",
                  active
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-teal-700"
                )}
              >
                {filterLabel(f)}
                <span className={cx("rounded-full px-1.5 text-[0.72rem] tabular-nums", active ? "bg-white/20" : "bg-black/5")}>
                  {f === "all" ? counts.total : counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(300px,420px)_1fr]">
        {/* Study list */}
        <section className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white" aria-label="Studies">
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Studies to screen"
            aria-activedescendant={selected ? `opt-${selected.id}` : undefined}
            onKeyDown={onListKeyDown}
            className="m-0 max-h-[34vh] list-none overflow-y-auto p-1.5 md:max-h-[70vh]"
          >
            {visible.map((study, i) => {
              const isSelected = study.id === selectedId;
              const d = DECISIONS[study.status];
              return (
                <li
                  key={study.id}
                  id={`opt-${study.id}`}
                  data-study-id={study.id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => { setSelectedId(study.id); focusOption(study.id); }}
                  className={cx(
                    "flex cursor-pointer items-start gap-2.5 rounded-md p-2.5",
                    isSelected ? "bg-teal-50" : "hover:bg-slate-50"
                  )}
                >
                  <span className={cx("mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full", d.dot)} aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-2 text-[0.86rem] leading-snug">{study.title}</span>
                    <span className="text-[0.74rem] text-slate-500">
                      {study.authors[0]}{study.authors.length > 1 ? " et al." : ""} · {study.year}
                    </span>
                  </span>
                  <span className="text-[0.72rem] tabular-nums text-slate-400" aria-hidden="true">{i + 1}</span>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="p-5 text-[0.86rem] text-slate-500" role="option" aria-selected="false" aria-disabled="true">
                No studies match this filter. Try “All” or clear the search.
              </li>
            )}
          </ul>
        </section>

        {/* Reading pane */}
        <section className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white" aria-label="Selected study">
          {selected ? (
            <article className="flex-1 overflow-y-auto p-6">
              <div className="mb-3.5 flex items-center justify-between">
                <span className={cx("rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wide", DECISIONS[selected.status].pill)}>
                  {selected.status === "undecided" ? "Undecided" : DECISIONS[selected.status].label}
                </span>
                <span className="text-[0.78rem] tabular-nums text-slate-500">
                  Study {selectedIndex + 1} of {visible.length}
                </span>
              </div>

              <h2 className="m-0 mb-1.5 text-[1.32rem] font-semibold leading-tight tracking-tight">{selected.title}</h2>
              <p className="m-0 mb-5 text-[0.9rem] text-slate-500">{selected.authors.join(", ")} · {selected.year}</p>

              <div className="max-w-[68ch] rounded-lg border border-slate-200 bg-neutral-50 px-5 py-5 text-[1.02rem] leading-[1.72] text-slate-800" tabIndex={0} aria-label="Abstract">
                {selected.abstract}
              </div>

              <div className="sticky bottom-0 mt-5 flex flex-wrap gap-2.5" role="group" aria-label="Record a decision">
                {statuses.map((status) => {
                  const d = DECISIONS[status];
                  const active = selected.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={active}
                      onClick={() => decide(status)}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-lg border-[1.5px] px-3.5 py-2 text-[0.88rem] font-medium transition-transform active:translate-y-px",
                        active ? d.btnActive : cx("border-slate-200 bg-white text-slate-800", d.btnHover)
                      )}
                    >
                      <d.Icon size={16} aria-hidden="true" />
                      <span>{d.label}</span>
                      <Kbd>{d.key.toUpperCase()}</Kbd>
                    </button>
                  );
                })}
              </div>
            </article>
          ) : (
            <div className="p-10 text-slate-500">Select a study to begin reviewing.</div>
          )}

          <footer className="flex items-center gap-2 border-t border-slate-200 px-5 py-2.5 text-[0.78rem] text-slate-500">
            <Keyboard size={14} aria-hidden="true" />
            <span className="flex flex-wrap items-center gap-1">
              <Kbd>↑</Kbd><Kbd>↓</Kbd> move · <Kbd>I</Kbd> include · <Kbd>E</Kbd> exclude · <Kbd>F</Kbd> flag · <Kbd>U</Kbd> clear
            </span>
          </footer>
        </section>
      </main>

      {/* Screen-reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    </div>
  );
}


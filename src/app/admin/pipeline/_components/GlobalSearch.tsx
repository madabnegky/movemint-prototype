"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { usePipeline } from "../_lib/PipelineContext";
import { STAGE_LABELS, fmtAssets } from "../_lib/stages";
import { UNIVERSE } from "../_lib/universe";
import type { FI } from "../_lib/types";
import { TypeBadge } from "./controls";
import { FIDrawer } from "./FIDrawer";

const MAX_RESULTS = 20;

export function GlobalSearch() {
  const { state } = usePipeline();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [drawerFi, setDrawerFi] = useState<FI | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const scored: Array<{ fi: FI; score: number }> = [];
    for (const fi of UNIVERSE) {
      const name = fi.name.toLowerCase();
      const city = fi.city.toLowerCase();
      let score = 0;
      if (name.startsWith(q)) score = 3;
      else if (name.includes(` ${q}`)) score = 2;
      else if (name.includes(q)) score = 1;
      else if (city.startsWith(q)) score = 0.5;
      else if (city.includes(q)) score = 0.25;
      if (score > 0) scored.push({ fi, score });
    }
    scored.sort(
      (a, b) => b.score - a.score || b.fi.assets - a.fi.assets,
    );
    return scored.slice(0, MAX_RESULTS).map((s) => s.fi);
  }, [query]);

  // Reset the highlighted row whenever the result set changes.
  useEffect(() => setActive(0), [query]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!state) return null;

  const choose = (fi: FI) => {
    setDrawerFi(fi);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const fi = results[active];
      if (fi) choose(fi);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <div ref={rootRef} className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search any institution by name or city…"
          className="w-full pl-10 pr-9 py-3 text-sm rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {open && query.trim().length >= 2 && (
          <div className="absolute z-40 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-lg max-h-[26rem] overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No institutions match “{query.trim()}”.
              </div>
            ) : (
              results.map((fi, i) => {
                const rec = state.records[fi.id];
                return (
                  <button
                    key={fi.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(fi)}
                    className={
                      "w-full text-left px-4 py-2.5 flex items-center gap-3 border-b border-slate-50 last:border-0 " +
                      (i === active ? "bg-slate-50" : "")
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-sm truncate">
                        {fi.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <TypeBadge type={fi.type} />
                        <span className="truncate">
                          {fi.city}, {fi.state}
                        </span>
                        <span className="tabular-nums shrink-0">{fmtAssets(fi.assets)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {rec?.stage ? (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 rounded px-2 py-0.5">
                          {STAGE_LABELS[rec.stage]}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-300">no deal</span>
                      )}
                      {rec?.owner && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{rec.owner}</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <FIDrawer fi={drawerFi} onClose={() => setDrawerFi(null)} />
    </>
  );
}

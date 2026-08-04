"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { STAGE_INFO, STAGE_LABELS } from "../_lib/stages";
import type { ListId } from "../_lib/types";

/** (i) button that reveals a stage's owner and definition.
 *  Opens on hover for pointer users and on click/Enter for keyboard and touch. */
export function StageInfo({ id, className }: { id: ListId; className?: string }) {
  const info = STAGE_INFO[id];
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!info) return null;

  return (
    <span
      ref={wrap}
      className={`relative inline-flex ${className ?? ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      data-print="hide"
    >
      <button
        type="button"
        aria-label={`What is ${STAGE_LABELS[id]}?`}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-slate-300 hover:text-slate-600 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <span
          id={tipId}
          role="tooltip"
          // Left-aligned to the icon, above the row, so it never sits under the
          // cursor and re-triggers mouseleave.
          className="absolute z-50 bottom-full left-0 mb-1.5 w-72 rounded-lg bg-slate-900 text-white p-3 shadow-xl text-left font-normal normal-case tracking-normal"
        >
          <span className="block text-[11px] font-semibold text-white mb-0.5">
            {STAGE_LABELS[id]}
          </span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
            {info.owner}
          </span>
          <span className="block text-xs leading-relaxed text-slate-200">{info.definition}</span>
        </span>
      )}
    </span>
  );
}

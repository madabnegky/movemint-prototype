"use client";

import { cn } from "@/lib/utils";
import { BRANCH_STAGES, MAIN_STAGES, STAGE_LABELS } from "../_lib/stages";
import type { StageId } from "../_lib/types";

export function StageSelect({
  value,
  onChange,
  className,
}: {
  value: StageId | null;
  onChange: (stage: StageId | null) => void;
  className?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value || null) as StageId | null)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "text-xs font-medium rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700",
        "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer",
        !value && "text-slate-400",
        className,
      )}
    >
      <option value="">— No deal —</option>
      <optgroup label="Funnel">
        {MAIN_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </optgroup>
      <optgroup label="Nurture / Removed">
        {BRANCH_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

export function OwnerSelect({
  value,
  owners,
  onChange,
  className,
}: {
  value: string | null;
  owners: string[];
  onChange: (owner: string | null) => void;
  className?: string;
}) {
  // Keep a departed owner visible instead of silently dropping it.
  const options = value && !owners.includes(value) ? [value, ...owners] : owners;
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "text-xs font-medium rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700",
        "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer",
        !value && "text-slate-400",
        className,
      )}
    >
      <option value="">Unassigned</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function TypeBadge({ type }: { type: "bank" | "cu" }) {
  return (
    <span
      className={cn(
        "inline-block text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5",
        type === "cu" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600",
      )}
    >
      {type === "cu" ? "CU" : "Bank"}
    </span>
  );
}

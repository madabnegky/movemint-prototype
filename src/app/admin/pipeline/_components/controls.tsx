"use client";

import { cn } from "@/lib/utils";
import { BRANCH_STAGES, MAIN_STAGES, STAGE_LABELS } from "../_lib/stages";
import type { Channel, StageId } from "../_lib/types";

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

export function ChannelBadge({
  channel,
  partner,
}: {
  channel?: Channel;
  partner?: string;
}) {
  const isReferral = channel === "referral";
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={cn(
          "inline-block text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5",
          isReferral ? "bg-violet-50 text-violet-600" : "bg-slate-100 text-slate-500",
        )}
      >
        {isReferral ? "Referral" : "Direct"}
      </span>
      {isReferral && partner && (
        <span className="text-[11px] text-slate-500 truncate max-w-28">{partner}</span>
      )}
    </span>
  );
}

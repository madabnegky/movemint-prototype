"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRANCH_STAGES, MAIN_STAGES, STAGE_LABELS } from "../_lib/stages";
import type { Channel, StageId } from "../_lib/types";

const OTHER = "__other__";

/**
 * Dropdown of known options + "Other…" that reveals a free-text field.
 * The current value is shown even if it isn't one of the options (e.g. a
 * previously-entered Other value), so nothing is silently lost.
 */
export function OptionOrOther({
  value,
  options,
  placeholder = "Not set",
  onChange,
  className,
}: {
  value: string | null | undefined;
  options: string[];
  placeholder?: string;
  onChange: (v: string | undefined) => void;
  className?: string;
}) {
  const known = value != null && value !== "" && options.includes(value);
  const [isOther, setIsOther] = useState(value != null && value !== "" && !known);

  const selectValue = isOther ? OTHER : (value ?? "");
  return (
    <div className="space-y-1.5">
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === OTHER) {
            setIsOther(true);
            onChange(value && !options.includes(value) ? value : "");
          } else {
            setIsOther(false);
            onChange(v || undefined);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full text-sm rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700",
          "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer",
          className,
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </select>
      {isOther && (
        <input
          autoFocus
          defaultValue={value && !options.includes(value) ? value : ""}
          placeholder="Type a value…"
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onChange(e.target.value.trim() || undefined)}
          className="w-full text-sm rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      )}
    </div>
  );
}

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

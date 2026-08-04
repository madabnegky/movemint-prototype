"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PARTNER_BRANCH_STAGES,
  PARTNER_CATEGORY_LABELS,
  PARTNER_MAIN_STAGES,
  PARTNER_STAGE_INFO,
  PARTNER_STAGE_LABELS,
} from "../_lib/stages";
import type { PartnerCategory, PartnerListId, PartnerStageId } from "../_lib/types";

/** Stage → chip colors. Signed is the win state, not-a-fit the dead end. */
const STAGE_CHIP: Record<PartnerStageId, string> = {
  "not-contacted": "bg-slate-100 text-slate-500",
  contacted: "bg-sky-50 text-sky-600",
  active: "bg-violet-50 text-violet-600",
  signed: "bg-emerald-50 text-emerald-600",
  dormant: "bg-amber-50 text-amber-600",
  "not-a-fit": "bg-slate-100 text-slate-400 line-through decoration-slate-300",
};

export function StageChip({ stage }: { stage: PartnerStageId }) {
  return (
    <span
      className={cn(
        "inline-block text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 whitespace-nowrap",
        STAGE_CHIP[stage],
      )}
    >
      {PARTNER_STAGE_LABELS[stage]}
    </span>
  );
}

export function PartnerStageSelect({
  value,
  onChange,
  className,
}: {
  value: PartnerStageId;
  onChange: (stage: PartnerStageId) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PartnerStageId)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "text-xs font-medium rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700",
        "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer",
        className,
      )}
    >
      <optgroup label="Pipeline">
        {PARTNER_MAIN_STAGES.map((s) => (
          <option key={s} value={s}>
            {PARTNER_STAGE_LABELS[s]}
          </option>
        ))}
      </optgroup>
      <optgroup label="Off-funnel">
        {PARTNER_BRANCH_STAGES.map((s) => (
          <option key={s} value={s}>
            {PARTNER_STAGE_LABELS[s]}
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
  value: string | null | undefined;
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

export function CategoryBadges({ categories }: { categories: PartnerCategory[] }) {
  if (!categories.length) return <span className="text-slate-300">—</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {categories.map((c) => (
        <span
          key={c}
          className="inline-block text-[10px] font-semibold rounded px-1.5 py-0.5 bg-slate-100 text-slate-600 whitespace-nowrap"
        >
          {PARTNER_CATEGORY_LABELS[c]}
        </span>
      ))}
    </span>
  );
}

/** (i) tooltip carrying a stage's owner + definition, mirroring the sales
 *  pipeline's StageInfo. CSS-only hover so it works inside links. */
export function PartnerStageInfo({ id }: { id: PartnerListId }) {
  const info = PARTNER_STAGE_INFO[id];
  if (!info) return null;
  return (
    <span className="relative inline-flex group/info shrink-0 align-middle">
      <Info className="w-3 h-3 text-slate-300 hover:text-slate-500 transition-colors" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-white shadow-lg group-hover/info:block"
      >
        <span className="block font-semibold uppercase tracking-wider text-slate-400 text-[9px] mb-0.5">
          {info.owner}
        </span>
        {info.definition}
      </span>
    </span>
  );
}

/** Reach cell: the raw string the team entered, with the parsed number as a
 *  secondary hint when they differ meaningfully. */
export function ReachCell({
  raw,
  value,
  qualifier,
}: {
  raw: string;
  value: number | null;
  qualifier: string;
}) {
  const display = raw.trim() || (qualifier === "na" ? "N/A" : "Unknown");
  const showEst = value != null && raw.trim() && raw.trim() !== value.toLocaleString();
  return (
    <span className="inline-flex flex-col leading-tight">
      <span
        className={cn(
          "tabular-nums font-semibold",
          value == null ? "text-slate-400" : "text-slate-700",
        )}
      >
        {display}
      </span>
      {showEst && (
        <span className="text-[10px] text-slate-400 tabular-nums">
          est. {value.toLocaleString()}
        </span>
      )}
    </span>
  );
}

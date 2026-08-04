"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePartners } from "../../_lib/PartnerContext";
import {
  ALL_PARTNER_STAGES,
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABELS,
  PARTNER_STAGE_LABELS,
  fmtCount,
  isPartnerListId,
} from "../../_lib/stages";
import { listPartners, reachTotal } from "../../_lib/partners";
import { exportPartnerList } from "../../_lib/exportCsv";
import type { Partner, PartnerCategory, PartnerStageId } from "../../_lib/types";
import { AddPartnerModal } from "../../_components/AddPartnerModal";
import { PartnerDrawer } from "../../_components/PartnerDrawer";
import {
  CategoryBadges,
  OwnerSelect,
  PartnerStageInfo,
  PartnerStageSelect,
  ReachCell,
} from "../../_components/controls";

type SortKey = "name" | "reach" | "referrals" | "stage" | "owner" | "updated";

export default function PartnerStagePage() {
  const params = useParams<{ stageId: string }>();
  const stageId = params.stageId;
  const { state, loading, updatePartners } = usePartners();

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PartnerCategory | "">("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("reach");
  const [asc, setAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (!isPartnerListId(stageId)) notFound();

  const rows = useMemo(() => {
    if (!state) return [];
    let list = listPartners(stageId, state);
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.companyType.toLowerCase().includes(needle) ||
          (p.primaryFocus ?? "").toLowerCase().includes(needle) ||
          (p.notes ?? "").toLowerCase().includes(needle) ||
          (p.reachNotes ?? "").toLowerCase().includes(needle),
      );
    }
    if (categoryFilter) list = list.filter((p) => p.categories.includes(categoryFilter));
    if (ownerFilter) {
      list =
        ownerFilter === "__unassigned__"
          ? list.filter((p) => !p.owner)
          : list.filter((p) => p.owner === ownerFilter);
    }
    const dir = asc ? 1 : -1;
    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "reach":
          return ((a.fiReach.value ?? -1) - (b.fiReach.value ?? -1)) * dir;
        case "referrals":
          return ((a.referralsProvided ?? 0) - (b.referralsProvided ?? 0)) * dir;
        case "stage":
          return (
            (ALL_PARTNER_STAGES.indexOf(a.stage) - ALL_PARTNER_STAGES.indexOf(b.stage)) * dir
          );
        case "owner":
          return (a.owner ?? "").localeCompare(b.owner ?? "") * dir;
        case "updated":
          return a.updatedAt.localeCompare(b.updatedAt) * dir;
        default:
          return 0;
      }
    });
    return sorted;
  }, [state, stageId, q, categoryFilter, ownerFilter, sort, asc]);

  if (loading || !state) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const owners = state.settings.owners;
  const reach = reachTotal(stageId, state);
  const open = openId ? state.partners[openId] : undefined;
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  };
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const bulk = (patch: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>) => {
    updatePartners([...selected], patch);
    setSelected(new Set());
  };

  const sortBtn = (key: SortKey, label: string, cls?: string) => (
    <button
      onClick={() => {
        if (sort === key) setAsc(!asc);
        else {
          setSort(key);
          setAsc(key === "name" || key === "owner");
        }
      }}
      className={cn(
        "text-left text-[11px] font-semibold uppercase tracking-wider hover:text-slate-700",
        sort === key ? "text-slate-700" : "text-slate-400",
        cls,
      )}
    >
      {label}
      {sort === key && <span className="ml-0.5">{asc ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/partners"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <h2 className="text-lg font-bold text-slate-900 inline-flex items-center gap-1.5 min-w-0">
            <span className="truncate">{PARTNER_STAGE_LABELS[stageId]}</span>
            <PartnerStageInfo id={stageId} />
          </h2>
          <span className="text-sm text-slate-400 shrink-0">
            {rows.length === reach.total
              ? `${reach.total} partner${reach.total === 1 ? "" : "s"}`
              : `${rows.length} of ${reach.total}`}
            {reach.known > 0 && ` · ${fmtCount(reach.known)} est. FI reach`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPartnerList(stageId, state)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" /> Add partner
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, type, focus, notes…"
            className="w-full text-sm rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as PartnerCategory | "")}
          className="text-sm rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-700"
        >
          <option value="">All types</option>
          {PARTNER_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PARTNER_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="text-sm rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-700"
        >
          <option value="">All owners</option>
          <option value="__unassigned__">Unassigned</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-white">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <span className="text-slate-500">|</span>
          <label className="inline-flex items-center gap-2 text-xs">
            Move to
            <PartnerStageSelect
              value={"contacted"}
              onChange={(stage) => bulk({ stage })}
              className="text-slate-700"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-xs">
            Assign
            <OwnerSelect
              value={null}
              owners={owners}
              onChange={(owner) => bulk({ owner })}
              className="text-slate-700"
            />
          </label>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs font-medium text-slate-300 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-9 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-3 py-2.5 text-left">{sortBtn("name", "Company")}</th>
                <th className="px-3 py-2.5 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Type
                  </span>
                </th>
                <th className="px-3 py-2.5 text-right">{sortBtn("reach", "FI Clients")}</th>
                <th className="px-3 py-2.5 text-right">{sortBtn("referrals", "Referrals")}</th>
                <th className="px-3 py-2.5 text-left">{sortBtn("stage", "Stage")}</th>
                <th className="px-3 py-2.5 text-left">{sortBtn("owner", "Owner")}</th>
                <th className="px-3 py-2.5 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Notes
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setOpenId(p.id)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selected.has(p.id) ? "bg-slate-50" : "hover:bg-slate-50/60",
                  )}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      aria-label={`Select ${p.name}`}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="truncate max-w-52">{p.name}</span>
                      {p.website && (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-300 hover:text-slate-600 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {p.primaryFocus && (
                      <div className="text-[11px] text-slate-400 truncate max-w-64">
                        {p.primaryFocus}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <CategoryBadges categories={p.categories} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ReachCell
                      raw={p.fiReach.raw}
                      value={p.fiReach.value}
                      qualifier={p.fiReach.qualifier}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        p.referralsProvided ? "text-slate-700" : "text-slate-300",
                      )}
                    >
                      {p.referralsProvided ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <PartnerStageSelect
                      value={p.stage}
                      onChange={(stage: PartnerStageId) =>
                        updatePartners([p.id], { stage })
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <OwnerSelect
                      value={p.owner}
                      owners={owners}
                      onChange={(owner) => updatePartners([p.id], { owner })}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-slate-500 line-clamp-2 max-w-72">
                      {p.notes ?? ""}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-sm text-slate-400">
                    {reach.total === 0
                      ? `No partners in ${PARTNER_STAGE_LABELS[stageId]} yet.`
                      : "No partners match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && <PartnerDrawer partner={open} onClose={() => setOpenId(null)} />}
      {adding && (
        <AddPartnerModal
          defaultStage={stageId === "all" ? "not-contacted" : stageId}
          onClose={() => setAdding(false)}
          onCreated={(id) => setOpenId(id)}
        />
      )}
    </div>
  );
}

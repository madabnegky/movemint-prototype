"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePipeline } from "../../_lib/PipelineContext";
import { STAGE_LABELS, fmtAssets, isListId } from "../../_lib/stages";
import { listMembers } from "../../_lib/universe";
import type { FI, StageId } from "../../_lib/types";
import { ChannelBadge, OwnerSelect, StageSelect, TypeBadge } from "../../_components/controls";
import { FIDrawer } from "../../_components/FIDrawer";

const PAGE_SIZE = 100;

type SortKey = "name" | "assets" | "state" | "stage" | "owner";

export default function StageListPage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  const { stageId } = use(params);
  const { state, loading, updateRecord, updateRecords } = usePipeline();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bank" | "cu">("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState<"all" | "direct" | "referral">("all");
  const [coreFilter, setCoreFilter] = useState("all");
  const [losFilter, setLosFilter] = useState("all");
  const [showTech, setShowTech] = useState(false);
  const [yearFilter, setYearFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("assets");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerFi, setDrawerFi] = useState<FI | null>(null);

  const members = useMemo(() => {
    if (!state || !isListId(stageId)) return [];
    return listMembers(stageId, state);
  }, [state, stageId]);

  const states = useMemo(
    () => [...new Set(members.map((fi) => fi.state))].sort(),
    [members],
  );

  const filtered = useMemo(() => {
    if (!state) return [];
    const q = search.trim().toLowerCase();
    let out = members;
    if (q) {
      out = out.filter(
        (fi) =>
          fi.name.toLowerCase().includes(q) || fi.city.toLowerCase().includes(q),
      );
    }
    if (typeFilter !== "all") out = out.filter((fi) => fi.type === typeFilter);
    if (stateFilter !== "all") out = out.filter((fi) => fi.state === stateFilter);
    if (ownerFilter !== "all") {
      out = out.filter((fi) =>
        ownerFilter === "unassigned"
          ? !state.records[fi.id]?.owner
          : state.records[fi.id]?.owner === ownerFilter,
      );
    }
    if (yearFilter !== "all") {
      out = out.filter((fi) => String(state.records[fi.id]?.closedYear ?? "") === yearFilter);
    }
    if (channelFilter !== "all") {
      out = out.filter(
        (fi) => (state.records[fi.id]?.channel ?? "direct") === channelFilter,
      );
    }
    if (coreFilter !== "all") {
      out = out.filter((fi) => (state.records[fi.id]?.coreSystem ?? "") === coreFilter);
    }
    if (losFilter !== "all") {
      out = out.filter((fi) => (state.records[fi.id]?.los ?? "") === losFilter);
    }
    const dir = sortDesc ? -1 : 1;
    const rec = (fi: FI) => state.records[fi.id];
    out = [...out].sort((a, b) => {
      switch (sortKey) {
        case "assets":
          return (a.assets - b.assets) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "state":
          return a.state.localeCompare(b.state) * dir;
        case "stage":
          return String(rec(a)?.stage ?? "").localeCompare(String(rec(b)?.stage ?? "")) * dir;
        case "owner":
          return String(rec(a)?.owner ?? "").localeCompare(String(rec(b)?.owner ?? "")) * dir;
      }
    });
    return out;
  }, [members, state, search, typeFilter, stateFilter, ownerFilter, channelFilter, coreFilter, losFilter, yearFilter, sortKey, sortDesc]);

  // Distinct core/LOS values present in this list, for the filter dropdowns.
  const coreValues = useMemo(() => {
    if (!state) return [];
    const s = new Set<string>();
    for (const fi of members) {
      const v = state.records[fi.id]?.coreSystem;
      if (v) s.add(v);
    }
    return [...s].sort();
  }, [members, state]);
  const losValues = useMemo(() => {
    if (!state) return [];
    const s = new Set<string>();
    for (const fi of members) {
      const v = state.records[fi.id]?.los;
      if (v) s.add(v);
    }
    return [...s].sort();
  }, [members, state]);

  const isClosedView = stageId === "closed-won" || stageId === "closed-lost";
  const closedYearOptions = useMemo(() => {
    if (!state || !isClosedView) return [];
    const ys = new Set<number>();
    for (const fi of members) {
      const y = state.records[fi.id]?.closedYear;
      if (y) ys.add(y);
    }
    return [...ys].sort((a, b) => b - a);
  }, [members, state, isClosedView]);

  if (loading || !state) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isListId(stageId)) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
        Unknown pipeline stage “{stageId}”.{" "}
        <Link href="/admin/pipeline" className="underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const allOnPageSelected = rows.length > 0 && rows.every((fi) => selected.has(fi.id));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else {
      setSortKey(key);
      setSortDesc(key === "assets");
    }
  };

  const bulkApply = (patch: { stage?: StageId | null; owner?: string | null }) => {
    updateRecords([...selected], patch);
    setSelected(new Set());
  };

  const Th = ({
    label,
    k,
    className,
  }: {
    label: string;
    k?: SortKey;
    className?: string;
  }) => (
    <th
      onClick={k ? () => toggleSort(k) : undefined}
      className={cn(
        "text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-2 whitespace-nowrap",
        k && "cursor-pointer select-none hover:text-slate-600",
        className,
      )}
    >
      {label}
      {k && sortKey === k && <span className="ml-1">{sortDesc ? "↓" : "↑"}</span>}
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/admin/pipeline"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h2 className="text-lg font-bold text-slate-900">{STAGE_LABELS[stageId]}</h2>
        <span className="text-sm text-slate-400 tabular-nums">
          {filtered.length.toLocaleString()} institutions
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search name or city…"
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as typeof typeFilter);
            setPage(0);
          }}
          className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <option value="all">All types</option>
          <option value="cu">Credit Unions</option>
          <option value="bank">Banks</option>
        </select>
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(0);
          }}
          className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <option value="all">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={ownerFilter}
          onChange={(e) => {
            setOwnerFilter(e.target.value);
            setPage(0);
          }}
          className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <option value="all">All owners</option>
          <option value="unassigned">Unassigned</option>
          {state.settings.owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value as typeof channelFilter);
            setPage(0);
          }}
          className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <option value="all">All channels</option>
          <option value="direct">Direct</option>
          <option value="referral">Referral</option>
        </select>
        {coreValues.length > 0 && (
          <select
            value={coreFilter}
            onChange={(e) => {
              setCoreFilter(e.target.value);
              setPage(0);
            }}
            className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 max-w-50"
          >
            <option value="all">All cores</option>
            {coreValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
        {losValues.length > 0 && (
          <select
            value={losFilter}
            onChange={(e) => {
              setLosFilter(e.target.value);
              setPage(0);
            }}
            className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 max-w-50"
          >
            <option value="all">All LOS</option>
            {losValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setShowTech((v) => !v)}
          className={cn(
            "text-sm font-medium rounded-lg border px-3 py-2 transition-colors",
            showTech
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
          )}
        >
          {showTech ? "Hide tech columns" : "Show tech columns"}
        </button>
        {isClosedView && closedYearOptions.length > 0 && (
          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(0);
            }}
            className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <option value="all">All years</option>
            {closedYearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>

      {selected.size > 0 && (
        <div className="sticky top-2 z-30 flex flex-wrap items-center gap-3 bg-slate-900 text-white rounded-xl px-4 py-3 shadow-lg">
          <span className="text-sm font-semibold tabular-nums">
            {selected.size} selected
          </span>
          <span className="text-xs text-slate-300">Move to:</span>
          <StageSelect value={null} onChange={(stage) => bulkApply({ stage })} />
          <span className="text-xs text-slate-300">Assign:</span>
          <OwnerSelect
            value={null}
            owners={state.settings.owners}
            onChange={(owner) => bulkApply({ owner })}
          />
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs font-medium text-slate-300 hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Mobile: stacked cards. The table is unusable at phone widths. */}
      <label className="md:hidden flex items-center gap-2 text-xs font-medium text-slate-500 px-1">
        <input
          type="checkbox"
          checked={allOnPageSelected}
          onChange={() => {
            const next = new Set(selected);
            if (allOnPageSelected) rows.forEach((fi) => next.delete(fi.id));
            else rows.forEach((fi) => next.add(fi.id));
            setSelected(next);
          }}
          className="w-4 h-4 accent-slate-900"
        />
        Select all on this page ({rows.length})
      </label>
      <div className="md:hidden space-y-2">
        {rows.map((fi) => {
          const rec = state.records[fi.id];
          return (
            <div
              key={fi.id}
              onClick={() => setDrawerFi(fi)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-3"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(fi.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => {
                    const next = new Set(selected);
                    if (next.has(fi.id)) next.delete(fi.id);
                    else next.add(fi.id);
                    setSelected(next);
                  }}
                  className="w-4 h-4 accent-slate-900 mt-1 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-800 leading-snug">{fi.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <TypeBadge type={fi.type} />
                    <span>
                      {fi.city}, {fi.state}
                    </span>
                    <span className="tabular-nums font-medium text-slate-600">
                      {fmtAssets(fi.assets)}
                    </span>
                    {rec?.platformFit && (
                      <span className="inline-flex items-center gap-1 text-violet-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> fit
                      </span>
                    )}
                    {rec?.channel === "referral" && (
                      <ChannelBadge channel={rec.channel} partner={rec.referralPartner} />
                    )}
                  </div>
                  {rec?.leadSource && (
                    <div className="text-[11px] text-teal-600 mt-1">{rec.leadSource}</div>
                  )}
                  {(rec?.coreSystem || rec?.los) && (
                    <div className="text-[11px] text-slate-400 mt-1 space-x-2">
                      {rec?.coreSystem && <span>Core: {rec.coreSystem}</span>}
                      {rec?.los && <span>LOS: {rec.los}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div
                className="grid grid-cols-2 gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <StageSelect
                  value={rec?.stage ?? null}
                  onChange={(stage) => updateRecord(fi.id, { stage })}
                  className="w-full"
                />
                <OwnerSelect
                  value={rec?.owner ?? null}
                  owners={state.settings.owners}
                  onChange={(owner) => updateRecord(fi.id, { owner })}
                  className="w-full"
                />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
            No institutions match.
          </div>
        )}
      </div>

      {/* Tablet & desktop: full table. */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={() => {
                    const next = new Set(selected);
                    if (allOnPageSelected) rows.forEach((fi) => next.delete(fi.id));
                    else rows.forEach((fi) => next.add(fi.id));
                    setSelected(next);
                  }}
                  className="w-4 h-4 accent-slate-900"
                />
              </th>
              <Th label="Institution" k="name" />
              <Th label="Type" />
              <Th label="Location" k="state" />
              <Th label="Assets" k="assets" className="text-right" />
              <Th label="Fit" />
              <Th label="Lead Source" />
              <Th label="Channel" />
              {showTech && <Th label="Core" />}
              {showTech && <Th label="LOS" />}
              {showTech && <Th label="Home Banking" />}
              <Th label="Stage" k="stage" />
              <Th label="Owner" k="owner" />
            </tr>
          </thead>
          <tbody>
            {rows.map((fi) => {
              const rec = state.records[fi.id];
              return (
                <tr
                  key={fi.id}
                  onClick={() => setDrawerFi(fi)}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(fi.id)}
                      onChange={() => {
                        const next = new Set(selected);
                        if (next.has(fi.id)) next.delete(fi.id);
                        else next.add(fi.id);
                        setSelected(next);
                      }}
                      className="w-4 h-4 accent-slate-900"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800 max-w-xs truncate">
                    {fi.name}
                  </td>
                  <td className="px-3 py-2">
                    <TypeBadge type={fi.type} />
                  </td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                    {fi.city}, {fi.state}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-700">
                    {fmtAssets(fi.assets)}
                  </td>
                  <td className="px-3 py-2">
                    {rec?.platformFit && (
                      <span className="inline-block w-2 h-2 rounded-full bg-violet-500" title="Platform fit" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap max-w-[120px] truncate">
                    {rec?.leadSource ?? ""}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <ChannelBadge channel={rec?.channel} partner={rec?.referralPartner} />
                  </td>
                  {showTech && (
                    <td className="px-3 py-2 text-xs text-slate-500 max-w-40 truncate">
                      {rec?.coreSystem ?? ""}
                    </td>
                  )}
                  {showTech && (
                    <td className="px-3 py-2 text-xs text-slate-500 max-w-40 truncate">
                      {rec?.los ?? ""}
                    </td>
                  )}
                  {showTech && (
                    <td className="px-3 py-2 text-xs text-slate-500 max-w-40 truncate">
                      {rec?.homeBanking ?? ""}
                    </td>
                  )}
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <StageSelect
                      value={rec?.stage ?? null}
                      onChange={(stage) => updateRecord(fi.id, { stage })}
                    />
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <OwnerSelect
                      value={rec?.owner ?? null}
                      owners={state.settings.owners}
                      onChange={(owner) => updateRecord(fi.id, { owner })}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={showTech ? 13 : 10} className="px-3 py-10 text-center text-slate-400">
                  No institutions match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="tabular-nums">
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <FIDrawer fi={drawerFi} onClose={() => setDrawerFi(null)} />
    </div>
  );
}

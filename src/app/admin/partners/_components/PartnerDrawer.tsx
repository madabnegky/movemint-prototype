"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FI_BY_ID, searchInstitutions } from "@/app/admin/pipeline/_lib/universe";
import { fmtAssets } from "@/app/admin/pipeline/_lib/stages";
import { usePartners } from "../_lib/PartnerContext";
import { describeRevShare } from "../_lib/partners";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABELS,
  REV_SHARE_MODEL_LABELS,
  parseCategories,
  parseReach,
} from "../_lib/stages";
import type { Partner, PartnerCategory, RevShare, RevShareModel } from "../_lib/types";
import { OwnerSelect, PartnerStageSelect } from "./controls";

const REV_MODELS = Object.keys(REV_SHARE_MODEL_LABELS) as RevShareModel[];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full text-sm rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300";

/** Commercial terms editor. Only the inputs relevant to the chosen model are
 *  shown, so an unset rate can't masquerade as agreed terms. */
function RevShareEditor({
  value,
  onChange,
}: {
  value: RevShare | undefined;
  onChange: (next: RevShare | undefined) => void;
}) {
  const rs: RevShare = value ?? { model: "none" };
  const set = (patch: Partial<RevShare>) => {
    const next = { ...rs, ...patch };
    // Collapsing back to "none" with no other signal clears the object entirely.
    if (next.model === "none" && !next.notes && !next.isReseller) {
      onChange(undefined);
      return;
    }
    onChange(next);
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <Field label="Rev share model">
        <select
          value={rs.model}
          onChange={(e) => set({ model: e.target.value as RevShareModel })}
          className={inputCls}
        >
          {REV_MODELS.map((m) => (
            <option key={m} value={m}>
              {REV_SHARE_MODEL_LABELS[m]}
            </option>
          ))}
        </select>
      </Field>

      {rs.model === "percent-arr" && (
        <Field label="Share of ARR (%)" hint="20 = 20% of each deal's ARR">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={rs.percent != null ? rs.percent * 100 : ""}
            onChange={(e) =>
              set({ percent: e.target.value === "" ? undefined : Number(e.target.value) / 100 })
            }
            className={inputCls}
          />
        </Field>
      )}

      {rs.model === "per-record" && (
        <Field label="Rate per record ($)" hint="Often fractions of a cent — decimals are fine">
          <input
            type="number"
            min={0}
            step={0.0001}
            value={rs.perRecordRate ?? ""}
            onChange={(e) =>
              set({ perRecordRate: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            className={inputCls}
          />
        </Field>
      )}

      {rs.model === "flat-fee" && (
        <Field label="Fee per closed deal ($)">
          <input
            type="number"
            min={0}
            step={500}
            value={rs.flatFee ?? ""}
            onChange={(e) =>
              set({ flatFee: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            className={inputCls}
          />
        </Field>
      )}

      {rs.model !== "none" && (
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={rs.isReseller ?? false}
              onChange={(e) => set({ isReseller: e.target.checked || undefined })}
              className="rounded border-slate-300"
            />
            Full reseller
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={rs.outbound ?? false}
              onChange={(e) => set({ outbound: e.target.checked || undefined })}
              className="rounded border-slate-300"
            />
            We pay the partner
          </label>
        </div>
      )}

      <Field label="Terms notes">
        <textarea
          rows={2}
          value={rs.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value || undefined })}
          placeholder="Anything the fields above can't capture…"
          className={cn(inputCls, "resize-y")}
        />
      </Field>

      {rs.model !== "none" && (
        <p className="text-[11px] text-slate-500">
          Summary: <b className="text-slate-700">{describeRevShare(rs)}</b>
        </p>
      )}
    </div>
  );
}

/** Links FIs from the sales pipeline to this partner. Reuses the sales
 *  pipeline's ranked institution search so terse registry names resolve. */
function SourcedFiEditor({
  ids,
  onChange,
}: {
  ids: string[];
  onChange: (next: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim().length < 2 ? [] : searchInstitutions(q, 8)), [q]);
  const linked = ids.map((id) => ({ id, fi: FI_BY_ID.get(id) }));

  return (
    <div className="space-y-2">
      {linked.length > 0 && (
        <ul className="space-y-1">
          {linked.map(({ id, fi }) => (
            <li
              key={id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
            >
              <span className="min-w-0 text-sm text-slate-700 truncate">
                {fi ? (
                  <>
                    {fi.name}{" "}
                    <span className="text-slate-400 text-xs">
                      {fi.city}, {fi.state} · {fmtAssets(fi.assets)}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">Unknown FI ({id})</span>
                )}
              </span>
              <button
                onClick={() => onChange(ids.filter((x) => x !== id))}
                className="text-slate-300 hover:text-red-500 shrink-0"
                title="Unlink"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search institutions to link…"
        className={inputCls}
      />
      {results.length > 0 && (
        <ul className="max-h-48 overflow-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
          {results.map((fi) => {
            const already = ids.includes(fi.id);
            return (
              <li key={fi.id}>
                <button
                  disabled={already}
                  onClick={() => {
                    onChange([...ids, fi.id]);
                    setQ("");
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-sm flex items-center gap-2",
                    already
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {fi.name}{" "}
                    <span className="text-slate-400 text-xs">
                      {fi.city}, {fi.state}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function PartnerDrawer({
  partner,
  onClose,
}: {
  partner: Partner;
  onClose: () => void;
}) {
  const { state, updatePartner, deletePartner } = usePartners();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const owners = state?.settings.owners ?? [];

  const set = (patch: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>) =>
    updatePartner(partner.id, patch);

  const toggleCategory = (c: PartnerCategory) => {
    const next = partner.categories.includes(c)
      ? partner.categories.filter((x) => x !== c)
      : [...partner.categories, c];
    set({ categories: next });
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/20"
      />
      <div className="relative w-full max-w-md h-full overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <input
              value={partner.name}
              onChange={(e) => set({ name: e.target.value })}
              className="w-full text-lg font-bold text-slate-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-300 rounded px-1 -mx-1"
            />
            {partner.website && (
              <a
                href={partner.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mt-0.5"
              >
                {partner.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <PartnerStageSelect
                value={partner.stage}
                onChange={(stage) => set({ stage })}
                className="w-full"
              />
            </Field>
            <Field label="Owner">
              <OwnerSelect
                value={partner.owner}
                owners={owners}
                onChange={(owner) => set({ owner })}
                className="w-full"
              />
            </Field>
          </div>

          <Field
            label="Referrals provided"
            hint="Referrals this partner has actually sent us"
          >
            <input
              type="number"
              min={0}
              step={1}
              value={partner.referralsProvided ?? ""}
              onChange={(e) =>
                set({
                  referralsProvided:
                    e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
                })
              }
              placeholder="0"
              className={inputCls}
            />
          </Field>

          <Field label="Company type" hint="Free text — categories below drive filtering">
            <input
              value={partner.companyType}
              onChange={(e) => set({ companyType: e.target.value })}
              onBlur={(e) => {
                // Re-derive categories only when the user hasn't hand-picked any.
                if (!partner.categories.length && e.target.value.trim()) {
                  set({ categories: parseCategories(e.target.value) });
                }
              }}
              placeholder="e.g. CUSO / Payments"
              className={inputCls}
            />
          </Field>

          <Field label="Categories">
            <div className="flex flex-wrap gap-1.5">
              {PARTNER_CATEGORIES.map((c) => {
                const on = partner.categories.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={cn(
                      "text-[11px] font-semibold rounded-full px-2.5 py-1 border transition-colors",
                      on
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400",
                    )}
                  >
                    {PARTNER_CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="FI clients"
            hint={
              partner.fiReach.value == null
                ? `Not counted in reach totals (${partner.fiReach.qualifier})`
                : `Counts as ${partner.fiReach.value.toLocaleString()} (${partner.fiReach.qualifier})`
            }
          >
            <input
              value={partner.fiReach.raw}
              onChange={(e) => set({ fiReach: parseReach(e.target.value) })}
              placeholder="e.g. 700+, ~150–200, Hundreds, N/A"
              className={inputCls}
            />
          </Field>

          <Field label="Notes on FI clients" hint="Where the number came from">
            <textarea
              rows={2}
              value={partner.reachNotes ?? ""}
              onChange={(e) => set({ reachNotes: e.target.value || undefined })}
              className={cn(inputCls, "resize-y")}
            />
          </Field>

          <Field label="Primary focus">
            <input
              value={partner.primaryFocus ?? ""}
              onChange={(e) => set({ primaryFocus: e.target.value || undefined })}
              className={inputCls}
            />
          </Field>

          <Field label="Website">
            <input
              value={partner.website ?? ""}
              onChange={(e) => set({ website: e.target.value || undefined })}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && !/^https?:\/\//i.test(v)) set({ website: `https://${v}` });
              }}
              placeholder="example.com"
              className={inputCls}
            />
          </Field>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Commercial terms
            </span>
            <RevShareEditor value={partner.revShare} onChange={(rs) => set({ revShare: rs })} />
          </div>

          <Field
            label="Sourced institutions"
            hint="FIs in the sales pipeline attributable to this partner"
          >
            <SourcedFiEditor
              ids={partner.sourcedFiIds ?? []}
              onChange={(sourcedFiIds) => set({ sourcedFiIds })}
            />
          </Field>

          <Field label="Movemint notes">
            <textarea
              rows={4}
              value={partner.notes ?? ""}
              onChange={(e) => set({ notes: e.target.value || undefined })}
              className={cn(inputCls, "resize-y")}
            />
          </Field>

          <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-400 space-y-1">
            <div>Updated {new Date(partner.updatedAt).toLocaleString()}</div>
            {partner.imported && <div>Imported from the partner pipeline workbook</div>}
          </div>

          <div className="border-t border-slate-200 pt-3">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 flex-1">
                  Delete {partner.name}? This can&apos;t be undone.
                </span>
                <button
                  onClick={() => {
                    deletePartner(partner.id);
                    onClose();
                  }}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete partner
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

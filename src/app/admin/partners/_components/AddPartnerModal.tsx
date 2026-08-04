"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePartners } from "../_lib/PartnerContext";
import { parseCategories, parseReach } from "../_lib/stages";
import type { PartnerStageId } from "../_lib/types";
import { OwnerSelect, PartnerStageSelect } from "./controls";

const inputCls =
  "w-full text-sm rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300";

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

/**
 * Minimal add form — name and stage are the only requirements. Everything else
 * is editable in the drawer afterwards, so adding a partner mid-call takes one
 * field. Categories are auto-derived from the type string on submit.
 */
export function AddPartnerModal({
  defaultStage = "not-contacted",
  onClose,
  onCreated,
}: {
  defaultStage?: PartnerStageId;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { state, createPartner } = usePartners();
  const owners = state?.settings.owners ?? [];
  const existing = Object.values(state?.partners ?? {});

  const [name, setName] = useState("");
  const [stage, setStage] = useState<PartnerStageId>(defaultStage);
  const [companyType, setCompanyType] = useState("");
  const [reach, setReach] = useState("");
  const [website, setWebsite] = useState("");
  const [focus, setFocus] = useState("");
  const [owner, setOwner] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const dupe = trimmed
    ? existing.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    : undefined;

  const submit = async () => {
    if (!trimmed || busy) return;
    setBusy(true);
    const site = website.trim();
    const id = await createPartner({
      name: trimmed,
      stage,
      companyType: companyType.trim(),
      categories: parseCategories(companyType),
      fiReach: parseReach(reach),
      website: site ? (/^https?:\/\//i.test(site) ? site : `https://${site}`) : undefined,
      primaryFocus: focus.trim() || undefined,
      owner,
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    onCreated?.(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-900/30" />
      <div className="relative w-full max-w-lg max-h-full overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Add partner</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <Field label="Company name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              placeholder="e.g. Alkami"
              className={inputCls}
            />
          </Field>
          {dupe && (
            <p className="text-[11px] text-amber-600">
              <b>{dupe.name}</b> is already tracked in {dupe.stage.replace(/-/g, " ")}. Adding this
              creates a second entry.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <PartnerStageSelect value={stage} onChange={setStage} className="w-full" />
            </Field>
            <Field label="Owner">
              <OwnerSelect value={owner} owners={owners} onChange={setOwner} className="w-full" />
            </Field>
          </div>

          <Field label="Company type" hint="Categories are derived from this">
            <input
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value)}
              placeholder="e.g. Fintech / Digital Banking"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="FI clients" hint="700+, ~150–200, N/A">
              <input
                value={reach}
                onChange={(e) => setReach(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Website">
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="example.com"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Primary focus">
            <input value={focus} onChange={(e) => setFocus(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Notes">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={cn(inputCls, "resize-y")}
            />
          </Field>

          <p className="text-[11px] text-slate-400">
            Commercial terms and sourced institutions are set in the partner detail panel after
            adding.
          </p>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <button
            onClick={onClose}
            className="text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={!trimmed || busy}
            className={cn(
              "text-sm font-semibold px-3 py-2 rounded-lg transition-colors",
              trimmed && !busy
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-200 text-slate-400 cursor-not-allowed",
            )}
          >
            {busy ? "Adding…" : "Add partner"}
          </button>
        </div>
      </div>
    </div>
  );
}

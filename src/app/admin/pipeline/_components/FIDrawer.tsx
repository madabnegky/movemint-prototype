"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { usePipeline } from "../_lib/PipelineContext";
import { STAGE_LABELS, fmtAssets } from "../_lib/stages";
import { inAssetBand } from "../_lib/universe";
import type { Contact, FI } from "../_lib/types";
import { OptionOrOther, OwnerSelect, StageSelect, TypeBadge } from "./controls";

function ContactsEditor({
  contacts,
  onChange,
}: {
  contacts: Contact[];
  onChange: (next: Contact[]) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");

  const add = () => {
    const n = name.trim();
    if (!n) return;
    onChange([
      ...contacts,
      { name: n, ...(email.trim() ? { email: email.trim() } : {}), ...(title.trim() ? { title: title.trim() } : {}) },
    ]);
    setName("");
    setEmail("");
    setTitle("");
  };
  const remove = (i: number) => onChange(contacts.filter((_, idx) => idx !== i));
  const makePrimary = (i: number) => {
    if (i === 0) return;
    const next = [...contacts];
    const [c] = next.splice(i, 1);
    onChange([c, ...next]);
  };

  return (
    <div className="space-y-2">
      {contacts.length === 0 && (
        <p className="text-xs text-slate-400">No contacts yet.</p>
      )}
      {contacts.map((c, i) => (
        <div
          key={i}
          className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
              {c.name}
              {i === 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 rounded px-1.5 py-0.5">
                  Primary
                </span>
              )}
            </div>
            {c.title && <div className="text-xs text-slate-400">{c.title}</div>}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="text-xs text-teal-600 hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {c.email}
              </a>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {i !== 0 && (
              <button
                onClick={() => makePrimary(i)}
                title="Make primary"
                className="text-[11px] text-slate-400 hover:text-slate-700"
              >
                ★
              </button>
            )}
            <button
              onClick={() => remove(i)}
              title="Remove contact"
              className="text-slate-300 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      <div className="space-y-1.5 pt-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contact name"
          className="w-full text-sm rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <div className="flex gap-1.5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="flex-1 min-w-0 text-sm rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-28 text-sm rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <button
          onClick={add}
          disabled={!name.trim()}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Add contact
        </button>
      </div>
    </div>
  );
}

export function FIDrawer({ fi, onClose }: { fi: FI | null; onClose: () => void }) {
  const { state, updateRecord } = usePipeline();
  const rec = fi ? state?.records[fi.id] : undefined;

  // Local buffers for free-text fields so we only save on blur.
  const [notes, setNotes] = useState("");
  const [arr, setArr] = useState("");
  const [partner, setPartner] = useState("");
  useEffect(() => {
    setNotes(rec?.notes ?? "");
    setArr(rec?.arr != null ? String(rec.arr) : "");
    setPartner(rec?.referralPartner ?? "");
  }, [fi?.id, rec?.notes, rec?.arr, rec?.referralPartner]);

  if (!fi || !state) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl border-l border-slate-200 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TypeBadge type={fi.type} />
              {!inAssetBand(fi) && (
                <span className="text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-slate-100 text-slate-500">
                  Outside $250M–$50B
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{fi.name}</h2>
            <div className="text-sm text-slate-500">
              {fi.city}, {fi.state} · {fmtAssets(fi.assets)} assets
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 mb-1 block">Stage</span>
              <StageSelect
                value={rec?.stage ?? null}
                onChange={(stage) => {
                  const isClosed = stage === "closed-won" || stage === "closed-lost";
                  updateRecord(fi.id, {
                    stage,
                    // Default a newly-closed deal to the current year; clear the
                    // attribution when it moves back to an open stage.
                    closedYear: isClosed
                      ? (rec?.closedYear ?? new Date().getFullYear())
                      : undefined,
                  });
                }}
                className="w-full"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 mb-1 block">Owner</span>
              <OwnerSelect
                value={rec?.owner ?? null}
                owners={state.settings.owners}
                onChange={(owner) => updateRecord(fi.id, { owner })}
                className="w-full"
              />
            </label>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-100 p-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contacts
            </span>
            <ContactsEditor
              contacts={rec?.contacts ?? []}
              onChange={(contacts) =>
                updateRecord(fi.id, { contacts: contacts.length ? contacts : undefined })
              }
            />
          </div>

          {(rec?.stage === "closed-won" || rec?.stage === "closed-lost") && (
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 mb-1 block">
                {rec.stage === "closed-won" ? "Win" : "Loss"} attributed to year
              </span>
              <select
                value={rec.closedYear ?? new Date().getFullYear()}
                onChange={(e) => updateRecord(fi.id, { closedYear: Number(e.target.value) })}
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + 1 - i).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 block">Sales channel</span>
            <div className="flex gap-2">
              {(["direct", "referral"] as const).map((ch) => {
                const active = (rec?.channel ?? "direct") === ch;
                return (
                  <button
                    key={ch}
                    onClick={() =>
                      updateRecord(fi.id, {
                        channel: ch,
                        // Clear the partner name when switching back to direct.
                        referralPartner: ch === "direct" ? undefined : rec?.referralPartner,
                      })
                    }
                    className={
                      "flex-1 text-sm font-medium rounded-lg border px-3 py-2 transition-colors " +
                      (active
                        ? ch === "referral"
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
                    }
                  >
                    {ch === "direct" ? "Direct" : "Referral"}
                  </button>
                );
              })}
            </div>
            {rec?.channel === "referral" && (
              <input
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                onBlur={() => updateRecord(fi.id, { referralPartner: partner || undefined })}
                placeholder="Referral partner name…"
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            )}
          </div>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50">
            <span>
              <span className="text-sm font-semibold text-slate-700 block">Platform fit</span>
              <span className="text-xs text-slate-400">
                Integration supported now or within 12 months
              </span>
            </span>
            <input
              type="checkbox"
              checked={rec?.platformFit ?? false}
              onChange={(e) => updateRecord(fi.id, { platformFit: e.target.checked })}
              className="w-4 h-4 accent-slate-900"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-500 mb-1 block">
              Deal ARR override ($ — blank uses the{" "}
              {state.settings.defaultDealArr.toLocaleString()} default)
            </span>
            <input
              type="number"
              value={arr}
              placeholder={String(state.settings.defaultDealArr)}
              onChange={(e) => setArr(e.target.value)}
              onBlur={() =>
                updateRecord(fi.id, { arr: arr === "" ? undefined : Number(arr) })
              }
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>

          {rec?.leadSource && (
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Lead source
              </span>
              <span className="inline-block text-xs font-medium bg-teal-50 text-teal-700 rounded px-2 py-1">
                {rec.leadSource}
              </span>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-slate-100 p-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tech stack
            </span>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 mb-1 block">
                Core banking system
              </span>
              <OptionOrOther
                value={rec?.coreSystem}
                options={state.settings.coreOptions ?? []}
                onChange={(v) => updateRecord(fi.id, { coreSystem: v })}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 mb-1 block">
                Loan origination system (LOS)
              </span>
              <OptionOrOther
                value={rec?.los}
                options={state.settings.losOptions ?? []}
                onChange={(v) => updateRecord(fi.id, { los: v })}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 mb-1 block">
                Home banking provider
              </span>
              <OptionOrOther
                value={rec?.homeBanking}
                options={state.settings.homeBankingOptions ?? []}
                onChange={(v) => updateRecord(fi.id, { homeBanking: v })}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-slate-500 mb-1 block">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => updateRecord(fi.id, { notes: notes || undefined })}
              rows={5}
              placeholder="Context, contacts, next steps…"
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-y"
            />
          </label>

          {rec?.stage && (
            <div className="text-xs text-slate-400">
              Currently in <b className="text-slate-600">{STAGE_LABELS[rec.stage]}</b>
              {rec.updatedAt && <> · updated {new Date(rec.updatedAt).toLocaleString()}</>}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

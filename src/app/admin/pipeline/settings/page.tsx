"use client";

import { useState } from "react";
import { Download, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { usePipeline } from "../_lib/PipelineContext";
import { ALL_STAGES, STAGE_LABELS, leadSourceOptionsFor } from "../_lib/stages";
import { FI_BY_ID, regIdLabel, regIdOf } from "../_lib/universe";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Editor for a settings list of free-text values (owners, lead sources).
 * Removing an entry only takes it out of the dropdown — records already using
 * it keep the value, which is why the delete tooltip says so.
 */
function ListEditor({
  items,
  placeholder,
  removeTitle,
  onChange,
}: {
  items: string[];
  placeholder: string;
  removeTitle: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <>
      <ul className="space-y-2 mb-3">
        {items.length === 0 && <li className="text-xs text-slate-400">None yet.</li>}
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
          >
            {item}
            <button
              onClick={() => onChange(items.filter((x) => x !== item))}
              className="text-slate-300 hover:text-red-500"
              title={removeTitle}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = draft.trim();
          if (v && !items.includes(v)) onChange([...items, v]);
          setDraft("");
        }}
        className="flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-slate-900 text-white rounded-lg px-3 py-2 hover:bg-slate-700"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>
    </>
  );
}

export default function PipelineSettingsPage() {
  const { state, loading, updateSettings, resetToSeed } = usePipeline();
  const [confirmReset, setConfirmReset] = useState(false);

  if (loading || !state) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  const { settings } = state;

  const exportCsv = () => {
    const header = [
      // reg_id is the bare FDIC cert / NCUA charter number, split out from `id`
      // so it can be matched against outside spreadsheets without editing.
      "id", "reg_id", "reg_id_type", "name", "type", "city", "state", "assets",
      // stage is the stored id ("qualified"); stage_label is what the UI shows
      // ("Sales Qualified Lead"), which is what a reader will recognize.
      "stage", "stage_label", "owner", "platform_fit", "lead_source", "channel", "referral_partner",
      "core_system", "los", "home_banking", "contacts", "arr", "closed_year", "notes", "updated_at",
    ];
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(",")];
    for (const rec of Object.values(state.records)) {
      const fi = FI_BY_ID.get(rec.fiId);
      if (!fi) continue;
      lines.push(
        [
          fi.id, regIdOf(fi), regIdLabel(fi), fi.name, fi.type, fi.city, fi.state, fi.assets,
          rec.stage ?? "", rec.stage ? STAGE_LABELS[rec.stage] : "",
          rec.owner ?? "", rec.platformFit ? "true" : "",
          rec.leadSource ?? "", rec.channel ?? "direct", rec.referralPartner ?? "",
          rec.coreSystem ?? "", rec.los ?? "", rec.homeBanking ?? "",
          (rec.contacts ?? [])
            .map((c) => (c.email ? `${c.name} <${c.email}>` : c.name))
            .join("; "),
          rec.arr ?? "", rec.closedYear ?? "", rec.notes ?? "", rec.updatedAt,
        ]
          .map(esc)
          .join(","),
      );
    }
    // BOM so Excel reads institution names as UTF-8 rather than mangling them.
    const blob = new Blob(["﻿" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movemint-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className="space-y-4">
        <Section title="Team owners">
          <ListEditor
            items={settings.owners}
            placeholder="Add owner…"
            removeTitle="Remove owner (existing assignments keep the name)"
            onChange={(owners) => updateSettings({ owners })}
          />
        </Section>

        <Section title="Lead sources">
          <p className="text-xs text-slate-400 mb-4">
            Offered in the Lead source dropdown on each FI, and in the bulk bar on stage
            lists. Reps can still type a one-off value via “Other…”.
          </p>
          <ListEditor
            items={leadSourceOptionsFor(settings)}
            placeholder="Add lead source…"
            removeTitle="Remove from the dropdown (FIs already using it keep the value)"
            onChange={(leadSourceOptions) => updateSettings({ leadSourceOptions })}
          />
        </Section>

        <Section title="Goals & modeling">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 mb-1 block">
                Sales goal (closed won / year)
              </span>
              <input
                type="number"
                value={settings.salesGoal}
                onChange={(e) => updateSettings({ salesGoal: Number(e.target.value) || 0 })}
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 mb-1 block">
                Default deal ARR ($)
              </span>
              <input
                type="number"
                value={settings.defaultDealArr}
                onChange={(e) =>
                  updateSettings({ defaultDealArr: Number(e.target.value) || 0 })
                }
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
        </Section>

        <Section title="Data">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 text-sm font-medium bg-white border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50"
            >
              <Download className="w-4 h-4" /> Export pipeline CSV
            </button>
            {confirmReset ? (
              <span className="inline-flex items-center gap-2">
                <button
                  onClick={() => {
                    void resetToSeed();
                    setConfirmReset(false);
                  }}
                  className="text-sm font-medium bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-500"
                >
                  Yes, wipe all changes
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4" /> Reset pipeline to seed
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Reset restores the workbook import ({new Date(state.updatedAt).toLocaleString()}{" "}
            currently live) and discards every stage move, owner assignment, and note made in
            the tool. This cannot be undone.
          </p>
        </Section>
      </div>

      <Section title="Stage probabilities">
        <p className="text-xs text-slate-400 mb-4">
          Used for the weighted pipeline: ARR × probability. Nurture probabilities model
          recovery and are credited to Marketing.
        </p>
        <div className="space-y-2">
          {ALL_STAGES.map((s) => (
            <label key={s} className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">{STAGE_LABELS[s]}</span>
              <span className="inline-flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round((settings.stageProbabilities[s] ?? 0) * 100)}
                  onChange={(e) =>
                    updateSettings({
                      stageProbabilities: {
                        ...settings.stageProbabilities,
                        [s]: Math.min(Math.max(Number(e.target.value) || 0, 0), 100) / 100,
                      },
                    })
                  }
                  className="w-20 text-sm text-right rounded-lg border border-slate-200 px-2 py-1.5"
                />
                <span className="text-xs text-slate-400">%</span>
              </span>
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}

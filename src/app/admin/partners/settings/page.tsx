"use client";

import { useState } from "react";
import { Download, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { usePartners } from "../_lib/PartnerContext";
import { exportAllPartners } from "../_lib/exportCsv";

function Section({
  title,
  children,
  description,
}: {
  title: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 mb-4">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

export default function PartnerSettingsPage() {
  const { state, loading, updateSettings, resetToSeed } = usePartners();
  const [newOwner, setNewOwner] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  if (loading || !state) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  const { settings } = state;
  const partnerCount = Object.keys(state.partners).length;

  const addOwner = () => {
    const name = newOwner.trim();
    if (!name || settings.owners.includes(name)) return;
    updateSettings({ owners: [...settings.owners, name] });
    setNewOwner("");
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Section
        title="Partnership owners"
        description="Who can be assigned a partner relationship. Removing someone leaves their existing assignments visible."
      >
        <ul className="space-y-2 mb-3">
          {settings.owners.map((o) => (
            <li
              key={o}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
            >
              <span className="text-sm text-slate-700">{o}</span>
              <button
                onClick={() =>
                  updateSettings({ owners: settings.owners.filter((x) => x !== o) })
                }
                className="text-slate-300 hover:text-red-500"
                title={`Remove ${o}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
          {settings.owners.length === 0 && (
            <li className="text-sm text-slate-400">No owners yet.</li>
          )}
        </ul>
        <div className="flex items-center gap-2">
          <input
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addOwner();
            }}
            placeholder="Add an owner…"
            className="flex-1 text-sm rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <button
            onClick={addOwner}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </Section>

      <Section
        title="Signed partner target"
        description="Drives the pace-to-target bar on the dashboard."
      >
        <input
          type="number"
          min={1}
          value={settings.signedGoal ?? 12}
          onChange={(e) => updateSettings({ signedGoal: Number(e.target.value) || 1 })}
          className="w-32 text-sm rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </Section>

      <Section
        title="Export"
        description={`Download all ${partnerCount} partners as CSV — every field, ordered by pipeline stage.`}
      >
        <button
          onClick={() => exportAllPartners(state)}
          className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Download className="w-4 h-4" /> Export partner pipeline
        </button>
      </Section>

      <Section
        title="Reset to imported baseline"
        description="Restores the 33 partners as they were imported from the original workbook. Every partner added, edited, or deleted since then is discarded."
      >
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-700 flex-1 min-w-48">
              Discard all changes and restore the imported baseline?
            </span>
            <button
              onClick={async () => {
                await resetToSeed();
                setConfirmReset(false);
              }}
              className="text-sm font-semibold px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Reset everything
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4" /> Reset to seed
          </button>
        )}
      </Section>
    </div>
  );
}

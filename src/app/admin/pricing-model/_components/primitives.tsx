"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Info, X } from "lucide-react";

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

export function Card({
  title,
  children,
  highlight,
  tone,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
  tone?: "muted";
}) {
  return (
    <div
      className={
        highlight
          ? "bg-slate-900 text-white p-4 md:p-6 rounded-xl shadow-sm"
          : tone === "muted"
            ? "bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200"
            : "bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm"
      }
    >
      <h3
        className={`text-sm font-semibold mb-4 ${highlight ? "text-slate-300 uppercase tracking-wider" : "text-slate-700"}`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function Row({
  label,
  value,
  bold,
  muted,
  positive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-slate-600 ${muted ? "text-slate-400 text-xs" : ""}`}>{label}</span>
      <span
        className={`font-mono ${bold ? "font-bold" : ""} ${muted ? "text-slate-400 text-xs" : "text-slate-900"} ${
          positive === true ? "text-emerald-600" : positive === false ? "text-rose-600" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function SliderInput({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  help,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  help?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          {help}
        </div>
        <span className="text-sm font-mono font-semibold text-slate-900">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {hint && (
        <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

export function NumberInput({
  label,
  hint,
  value,
  onChange,
  prefix,
  step,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full ${prefix ? "pl-7" : "pl-3"} pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
      {hint && (
        <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

export function HelpPopover({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        aria-label={`More info: ${title}`}
        onClick={() => setOpen((v) => !v)}
        className="text-slate-400 hover:text-blue-600 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-30 left-0 top-6 w-[min(440px,calc(100vw-3rem))] bg-white border border-slate-200 rounded-xl shadow-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">{children}</div>
          </div>
        </>
      )}
    </div>
  );
}

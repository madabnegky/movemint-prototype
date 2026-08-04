"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, CloudOff, Loader2, Printer, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { PipelineProvider, usePipeline } from "./_lib/PipelineContext";

function SaveIndicator() {
  const { saveStatus } = usePipeline();
  if (saveStatus === "idle") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        saveStatus === "error" ? "text-red-600" : "text-slate-500",
      )}
    >
      {saveStatus === "saving" && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
        </>
      )}
      {saveStatus === "saved" && (
        <>
          <Cloud className="w-3.5 h-3.5" /> Saved
        </>
      )}
      {saveStatus === "error" && (
        <>
          <CloudOff className="w-3.5 h-3.5" /> Save failed — retry your last change
        </>
      )}
    </span>
  );
}

function PipelineChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" data-print="hide">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-slate-900">
            <Link href="/admin/pipeline">Sales Pipeline</Link>
          </h1>
          <SaveIndicator />
        </div>
        <div className="flex items-center gap-2">
          {/* Dashboard only — the stage/settings pages have nothing to print. */}
          {pathname === "/admin/pipeline" && (
            <button
              onClick={() => window.print()}
              title="Opens your browser's print dialog — choose “Save as PDF”"
              className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" /> Save as PDF
            </button>
          )}
          <Link
            href="/admin/pipeline/settings"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors",
              pathname === "/admin/pipeline/settings"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
            )}
          >
            <Settings className="w-4 h-4" /> Settings
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  return (
    <PipelineProvider>
      <PipelineChrome>{children}</PipelineChrome>
    </PipelineProvider>
  );
}

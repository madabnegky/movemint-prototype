"use client";

import { useStore } from "@/context/StoreContext";
import { Sparkles, Cog } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewModeToggleProps {
    className?: string;
}

export function PreviewModeToggle({ className }: PreviewModeToggleProps) {
    const { previewMode, setPreviewMode } = useStore();

    return (
        <div className={cn("flex items-center gap-1 p-1 bg-slate-100 rounded-lg", className)}>
            <button
                onClick={() => setPreviewMode('demo')}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    previewMode === 'demo'
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                )}
            >
                <Sparkles className="w-3.5 h-3.5" />
                Demo
            </button>
            <button
                onClick={() => setPreviewMode('live')}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    previewMode === 'live'
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                )}
            >
                <Cog className="w-3.5 h-3.5" />
                Live
            </button>
        </div>
    );
}

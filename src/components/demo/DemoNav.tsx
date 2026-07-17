"use client";

import { ChevronDown } from "lucide-react";
import { useDemoStore } from "@/demo/DemoStoreContext";

/**
 * Consumer-facing nav for the demo surfaces, branded from demo config.
 * Decorative — nothing here navigates.
 */
export function DemoNav({ context = "Loans and Credit" }: { context?: string }) {
    const { config } = useDemoStore();

    return (
        <nav className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 lg:px-8">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    {config.fiLogoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={config.fiLogoDataUrl}
                            alt={config.fiName}
                            className="h-7 w-auto max-w-[140px] object-contain"
                        />
                    ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-[#143C67]">
                            <div className="grid h-3.5 w-3.5 grid-cols-2 gap-[2px]">
                                <div className="rounded-[1px] bg-white" />
                                <div className="rounded-[1px] bg-white" />
                                <div className="rounded-[1px] bg-white" />
                                <div className="rounded-[1px] bg-white/50" />
                            </div>
                        </div>
                    )}
                    <span className="text-[15px] font-semibold text-[#143C67]">{config.fiName}</span>
                </div>

                <div className="hidden items-center gap-4 border-l border-gray-200 pl-4 md:flex">
                    <span className="text-[13px] font-medium text-[#262C30]">{context}</span>
                </div>
            </div>

            <button className="flex items-center gap-1 text-[13px] font-medium text-[#262C30] transition-colors hover:text-[#143C67]">
                <span>Profile</span>
                <ChevronDown className="h-4 w-4 text-[#677178]" />
            </button>
        </nav>
    );
}

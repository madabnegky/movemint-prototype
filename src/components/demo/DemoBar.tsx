"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { HB_PROVIDERS, isHbProvider } from "@/demo/types";
import type { HbProvider } from "@/demo/types";

/**
 * Persistent demo chrome: switch consumer surface, jump back to setup.
 *
 * Surface lives in the URL rather than React state so every surface is
 * directly linkable and the back button behaves sensibly mid-demo. All demo
 * routes are siblings under /demo/layout.tsx, so these are client transitions
 * that preserve provider state — never a reload.
 */

const SURFACES = [
    { href: "/demo/landing", label: "Landing Page" },
    { href: "/demo/storefront", label: "Storefront" },
    { href: "/demo/home-banking", label: "Home Banking" },
] as const;

export function DemoBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);

    // Close the menu whenever we land somewhere new.
    useEffect(() => setOpen(false), [pathname, searchParams]);

    const providerParam = searchParams.get("provider");
    const activeProvider: HbProvider = isHbProvider(providerParam)
        ? providerParam
        : HB_PROVIDERS[0].value;

    const isHomeBanking = pathname.startsWith("/demo/home-banking");
    const active = SURFACES.find((s) => pathname.startsWith(s.href));
    const activeLabel = isHomeBanking
        ? `Home Banking · ${HB_PROVIDERS.find((p) => p.value === activeProvider)?.label}`
        : (active?.label ?? "Storefront");

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 rounded-full bg-[#262C30] px-4 py-2 text-[12px] font-medium text-white shadow-lg transition-colors hover:bg-black"
                >
                    <span>{activeLabel}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                    <div
                        role="menu"
                        className="absolute bottom-full right-0 mb-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
                    >
                        {SURFACES.map((surface) => {
                            const isActive = pathname.startsWith(surface.href);
                            if (surface.href === "/demo/home-banking") {
                                return (
                                    <div key={surface.href}>
                                        <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                            {surface.label}
                                        </div>
                                        {HB_PROVIDERS.map((provider) => {
                                            const selected = isActive && activeProvider === provider.value;
                                            return (
                                                <Link
                                                    key={provider.value}
                                                    href={`/demo/home-banking?provider=${provider.value}`}
                                                    role="menuitem"
                                                    className={cn(
                                                        "flex items-center justify-between px-3 py-2 pl-5 text-[13px] transition-colors",
                                                        selected
                                                            ? "bg-gray-50 font-medium text-[#262C30]"
                                                            : "text-gray-600 hover:bg-gray-50",
                                                    )}
                                                >
                                                    <span>{provider.label}</span>
                                                    {selected && <Check className="h-3.5 w-3.5 text-[#143C67]" />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                );
                            }
                            return (
                                <Link
                                    key={surface.href}
                                    href={surface.href}
                                    role="menuitem"
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2 text-[13px] transition-colors",
                                        isActive
                                            ? "bg-gray-50 font-medium text-[#262C30]"
                                            : "text-gray-600 hover:bg-gray-50",
                                    )}
                                >
                                    <span>{surface.label}</span>
                                    {isActive && <Check className="h-3.5 w-3.5 text-[#143C67]" />}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <Link
                href="/demo/setup"
                className="flex items-center gap-1.5 rounded-full bg-[#143C67] px-4 py-2 text-[12px] font-medium text-white shadow-lg transition-colors hover:bg-[#0f2d4d]"
            >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Setup</span>
            </Link>
        </div>
    );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, Search, User } from "lucide-react";
import { Q2OfferWidget } from "@/components/home-banking/Q2OfferWidget";
import { Q2ComposableWidget } from "@/components/home-banking/Q2ComposableWidget";
import { AlkamiOfferWidget } from "@/components/home-banking/AlkamiOfferWidget";
import { useDemoStore } from "@/demo/DemoStoreContext";
import { HB_PROVIDERS, isHbProvider } from "@/demo/types";
import type { HbProvider } from "@/demo/types";

/**
 * The DSF widget embedded in a partner's digital banking shell.
 *
 * Provider comes from ?provider= so the DemoBar can switch it as a client
 * transition and the surface stays deep-linkable. Only the three providers
 * with working widgets are reachable; NCR/Fiserv remain stubs on /home-banking.
 *
 * The shell here is deliberately generic chrome — the widget is what's being
 * demoed, and the partner-specific frames on /home-banking are ~500 lines of
 * mock furniture not worth duplicating.
 */

const ACCOUNTS = [
    { name: "Free Checking", number: "••••4821", balance: "$4,182.63" },
    { name: "Premium Savings", number: "••••7734", balance: "$18,940.12" },
];

function HomeBankingShell() {
    const { config } = useDemoStore();
    const searchParams = useSearchParams();

    const param = searchParams.get("provider");
    const provider: HbProvider = isHbProvider(param) ? param : HB_PROVIDERS[0].value;
    const providerLabel = HB_PROVIDERS.find((p) => p.value === provider)?.label ?? "";

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            {/* Partner shell chrome — decorative */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        {config.fiLogoDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={config.fiLogoDataUrl}
                                alt={config.fiName}
                                className="h-8 w-auto max-w-[150px] object-contain"
                            />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#143C67] text-[13px] font-bold text-white">
                                {config.fiName.charAt(0)}
                            </div>
                        )}
                        <span className="text-[16px] font-semibold text-slate-900">{config.fiName}</span>
                        <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                            {providerLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Search className="h-4 w-4" />
                        <Bell className="h-4 w-4" />
                        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                            <User className="h-4 w-4" />
                            {config.memberName}
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-6">
                <h1 className="mb-5 text-[22px] font-semibold text-slate-900">
                    Welcome back, {config.memberName}
                </h1>

                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="order-2 lg:order-1">
                        {provider === "q2-totalaccess" && <Q2OfferWidget />}
                        {provider === "q2-composable" && <Q2ComposableWidget />}
                        {provider === "alkami" && <AlkamiOfferWidget />}
                    </div>

                    {/* Account summary — decorative */}
                    <aside className="order-1 flex flex-col gap-3 lg:order-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Accounts
                            </div>
                            {ACCOUNTS.map((account) => (
                                <div
                                    key={account.number}
                                    className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0"
                                >
                                    <div>
                                        <div className="text-[13px] font-medium text-slate-800">
                                            {account.name}
                                        </div>
                                        <div className="text-[11px] text-slate-400">{account.number}</div>
                                    </div>
                                    <div className="text-[13px] font-semibold text-slate-900">
                                        {account.balance}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

export default function DemoHomeBankingPage() {
    return (
        <Suspense fallback={null}>
            <HomeBankingShell />
        </Suspense>
    );
}

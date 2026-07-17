"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
    AlertCircle,
    Car,
    CreditCard,
    Home,
    Lock,
    Mountain,
    Play,
    RefreshCw,
    RotateCcw,
    Shield,
    Store,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_OFFERS } from "@/context/StoreContext";
import type { OfferVariant } from "@/context/StoreContext";
import { useDemoStore } from "@/demo/DemoStoreContext";
import { SCENARIOS } from "@/demo/scenarios";
import type { ScenarioIconKey } from "@/demo/scenarios";
import { processLogoFile } from "@/demo/logo";
import { SELECTABLE_VARIANTS, formatPromoCode } from "@/demo/types";
import type { DemoOfferRef } from "@/demo/types";

const ICON_MAP: Record<ScenarioIconKey, React.ElementType> = {
    storefront: Store,
    car: Car,
    home: Home,
    "credit-card": CreditCard,
    shield: Shield,
    mountain: Mountain,
};

export default function DemoSetupPage() {
    const {
        config,
        storageError,
        updateConfig,
        setFlags,
        selectScenario,
        useHandpicked,
        setHandpickedOffers,
        regeneratePromoCode,
        resetConfig,
    } = useDemoStore();

    const [logoError, setLogoError] = useState<string | null>(null);
    const [logoBusy, setLogoBusy] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const mode = config.selection.mode;
    const handpicked: DemoOfferRef[] =
        config.selection.mode === "handpicked" ? config.selection.offers : [];

    const handleLogo = async (file: File | undefined) => {
        if (!file) return;
        setLogoBusy(true);
        setLogoError(null);
        const result = await processLogoFile(file);
        setLogoBusy(false);
        if (result.ok) updateConfig({ fiLogoDataUrl: result.dataUrl });
        else setLogoError(result.error);
    };

    const toggleOffer = (offerId: string, variant: OfferVariant) => {
        const existing = handpicked.find((o) => o.offerId === offerId);
        if (existing) {
            setHandpickedOffers(handpicked.filter((o) => o.offerId !== offerId));
        } else {
            setHandpickedOffers([...handpicked, { offerId, variant, isFeatured: false }]);
        }
    };

    const patchOffer = (offerId: string, patch: Partial<DemoOfferRef>) => {
        setHandpickedOffers(
            handpicked.map((o) => (o.offerId === offerId ? { ...o, ...patch } : o)),
        );
    };

    return (
        <div className="min-h-screen bg-[#F4F6F7] font-sans text-[#262C30]">
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-[900px] items-center justify-between px-8 py-5">
                    <div>
                        <h1 className="text-[20px] font-semibold">Demo Setup</h1>
                        <p className="text-[13px] text-gray-500">
                            Configure the demo, then launch. You can come back and change
                            anything mid-demo.
                        </p>
                    </div>
                    <Link
                        href="/demo/storefront"
                        className="flex items-center gap-2 rounded-full bg-[#262C30] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
                    >
                        <Play className="h-4 w-4" />
                        Launch Demo
                    </Link>
                </div>
            </header>

            <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-8 py-8">
                {storageError && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p className="text-[13px] text-amber-900">{storageError}</p>
                    </div>
                )}

                {/* Institution */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-1 text-[15px] font-semibold">Financial Institution</h2>
                    <p className="mb-5 text-[13px] text-gray-500">
                        Shown in the navigation and header across every surface.
                    </p>

                    <div className="flex flex-col gap-5 sm:flex-row">
                        <div className="flex-1">
                            <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
                                Institution name
                            </label>
                            <input
                                value={config.fiName}
                                onChange={(e) => updateConfig({ fiName: e.target.value })}
                                placeholder="Acme Credit Union"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] outline-none focus:border-[#143C67]"
                            />

                            <label className="mb-1.5 mt-4 block text-[12px] font-medium text-gray-600">
                                Member first name
                            </label>
                            <input
                                value={config.memberName}
                                onChange={(e) => updateConfig({ memberName: e.target.value })}
                                placeholder="Cameron"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] outline-none focus:border-[#143C67]"
                            />
                        </div>

                        <div className="sm:w-[220px]">
                            <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
                                Logo
                            </label>
                            {config.fiLogoDataUrl ? (
                                <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-300 p-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={config.fiLogoDataUrl}
                                        alt="Institution logo"
                                        className="h-12 w-auto max-w-full object-contain"
                                    />
                                    <button
                                        onClick={() => updateConfig({ fiLogoDataUrl: undefined })}
                                        className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-red-600"
                                    >
                                        <Trash2 className="h-3 w-3" /> Remove
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInput.current?.click()}
                                    disabled={logoBusy}
                                    className="flex h-[92px] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 transition-colors hover:border-[#143C67] hover:text-[#143C67] disabled:opacity-50"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span className="text-[12px]">
                                        {logoBusy ? "Processing…" : "Upload logo"}
                                    </span>
                                </button>
                            )}
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    void handleLogo(e.target.files?.[0]);
                                    e.target.value = "";
                                }}
                            />
                            {logoError && (
                                <p className="mt-2 flex items-start gap-1 text-[11px] text-red-600">
                                    <X className="mt-0.5 h-3 w-3 shrink-0" />
                                    {logoError}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Offers */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-1 text-[15px] font-semibold">Offers</h2>
                    <p className="mb-5 text-[13px] text-gray-500">
                        Load a preset story, or pick offers yourself.
                    </p>

                    <div className="mb-5 inline-flex rounded-lg bg-gray-100 p-1">
                        <button
                            onClick={() => selectScenario(SCENARIOS[0].id)}
                            className={cn(
                                "rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors",
                                mode === "scenario"
                                    ? "bg-white text-[#262C30] shadow-sm"
                                    : "text-gray-500 hover:text-gray-700",
                            )}
                        >
                            Preset scenario
                        </button>
                        <button
                            onClick={useHandpicked}
                            className={cn(
                                "rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors",
                                mode === "handpicked"
                                    ? "bg-white text-[#262C30] shadow-sm"
                                    : "text-gray-500 hover:text-gray-700",
                            )}
                        >
                            Pick offers
                        </button>
                    </div>

                    {mode === "scenario" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {SCENARIOS.map((scenario) => {
                                const Icon = ICON_MAP[scenario.icon];
                                const isActive =
                                    config.selection.mode === "scenario" &&
                                    config.selection.scenarioId === scenario.id;
                                return (
                                    <button
                                        key={scenario.id}
                                        onClick={() => selectScenario(scenario.id)}
                                        className={cn(
                                            "flex gap-3 rounded-xl border p-4 text-left transition-all",
                                            isActive
                                                ? "border-[#143C67] bg-[#143C67]/5 ring-1 ring-[#143C67]"
                                                : "border-gray-200 hover:border-gray-300",
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "mt-0.5 h-4 w-4 shrink-0",
                                                isActive ? "text-[#143C67]" : "text-gray-400",
                                            )}
                                        />
                                        <div>
                                            <div className="text-[13px] font-medium">{scenario.name}</div>
                                            <div className="mt-0.5 text-[12px] leading-snug text-gray-500">
                                                {scenario.description}
                                            </div>
                                            <div className="mt-1.5 text-[11px] text-gray-400">
                                                {scenario.offers.length} offer
                                                {scenario.offers.length !== 1 ? "s" : ""}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            <div className="mb-1 flex items-center justify-between text-[12px] text-gray-500">
                                <span>
                                    {handpicked.length} of {DEFAULT_OFFERS.length} selected
                                </span>
                                {handpicked.length > 0 && (
                                    <button
                                        onClick={() => setHandpickedOffers([])}
                                        className="hover:text-gray-700"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                            {DEFAULT_OFFERS.map((offer) => {
                                const picked = handpicked.find((o) => o.offerId === offer.id);
                                return (
                                    <div
                                        key={offer.id}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                                            picked ? "border-gray-300 bg-gray-50" : "border-gray-200",
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!picked}
                                            onChange={() => toggleOffer(offer.id, offer.variant)}
                                            className="h-4 w-4 shrink-0 accent-[#143C67]"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[13px] font-medium">
                                                {offer.title}
                                            </div>
                                            <div className="text-[11px] text-gray-400">{offer.section}</div>
                                        </div>

                                        {picked && (
                                            <>
                                                <select
                                                    value={picked.variant}
                                                    onChange={(e) =>
                                                        patchOffer(offer.id, {
                                                            variant: e.target.value as OfferVariant,
                                                        })
                                                    }
                                                    className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-[12px] outline-none focus:border-[#143C67]"
                                                >
                                                    {SELECTABLE_VARIANTS.map((v) => (
                                                        <option key={v.value} value={v.value}>
                                                            {v.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-gray-500">
                                                    <input
                                                        type="checkbox"
                                                        checked={picked.isFeatured}
                                                        onChange={(e) =>
                                                            patchOffer(offer.id, { isFeatured: e.target.checked })
                                                        }
                                                        className="h-3.5 w-3.5 accent-[#143C67]"
                                                    />
                                                    Hero
                                                </label>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Options */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-[15px] font-semibold">Options</h2>
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={config.flags.prequalification}
                            onChange={(e) => setFlags({ prequalification: e.target.checked })}
                            className="mt-0.5 h-4 w-4 accent-[#143C67]"
                        />
                        <div>
                            <div className="text-[13px] font-medium">
                                Consumer-initiated prequalification
                            </div>
                            <div className="text-[12px] text-gray-500">
                                Shows a card letting the member prequalify themselves without a
                                credit pull.
                            </div>
                        </div>
                    </label>
                </section>

                {/* Landing page */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-1 text-[15px] font-semibold">Landing Page</h2>
                    <p className="mb-5 text-[13px] text-gray-500">
                        The standalone URL shows the same storefront, but the member
                        authenticates first. Any last-four is accepted.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
                                Promo code (prefilled for the member)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    value={formatPromoCode(config.promoCode ?? "")}
                                    onChange={(e) =>
                                        updateConfig({
                                            promoCode: e.target.value.replace(/\D/g, "").slice(0, 16),
                                        })
                                    }
                                    inputMode="numeric"
                                    placeholder="1234 5678 9012 3456"
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-[14px] tracking-wider outline-none focus:border-[#143C67]"
                                />
                                <button
                                    onClick={regeneratePromoCode}
                                    title="Generate a new code"
                                    className="rounded-lg border border-gray-300 px-3 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span
                                className={cn(
                                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                    config.landingUnlocked
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-gray-100 text-gray-500",
                                )}
                            >
                                {config.landingUnlocked ? "Unlocked" : "Locked"}
                            </span>
                            <button
                                onClick={() => updateConfig({ landingUnlocked: false })}
                                disabled={!config.landingUnlocked}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-[12px] font-medium text-gray-600 transition-colors hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Lock className="h-3.5 w-3.5" />
                                Re-lock gate
                            </button>
                        </div>
                    </div>
                </section>

                <div className="flex justify-between pb-8">
                    <button
                        onClick={resetConfig}
                        className="flex items-center gap-1.5 text-[13px] text-gray-500 transition-colors hover:text-gray-700"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset to defaults
                    </button>
                    <Link
                        href="/demo/storefront"
                        className="flex items-center gap-2 rounded-full bg-[#262C30] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
                    >
                        <Play className="h-4 w-4" />
                        Launch Demo
                    </Link>
                </div>
            </main>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useDemoStore } from "@/demo/DemoStoreContext";
import { DEFAULT_PROMO_CODE, formatPromoCode } from "@/demo/types";

/**
 * The landing page's authentication step.
 *
 * In production the storefront is reached two ways: through home banking (already
 * authenticated) or at a standalone landing URL, where the member identifies
 * themselves with a promo code from their mailer plus the last four of their SSN.
 * This is that door — same storefront behind it either way.
 *
 * Any four digits are accepted. There is nothing to validate against without a
 * backend, and a demo should never dead-end on a typo.
 */
export function LandingGate({ onUnlock }: { onUnlock: () => void }) {
    const { config, updateConfig } = useDemoStore();
    const [lastFour, setLastFour] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Read the promo code straight from config rather than seeding local state
     * with it: the code is generated in the provider's mount effect, so a
     * useState seed would capture the placeholder that renders first and never
     * see the real one. Edits write back to config, keeping one source of truth.
     */
    const promoCode = config.promoCode ?? DEFAULT_PROMO_CODE;
    const setPromoCode = (value: string) => updateConfig({ promoCode: value });

    const canSubmit = promoCode.trim() !== "" && lastFour.length === 4 && !isSubmitting;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsSubmitting(true);
        // Matches the 1500ms fake latency the prequal card and membership flow use.
        setTimeout(onUnlock, 1500);
    };

    return (
        <div className="flex min-h-screen flex-col bg-page font-sans text-contrast-black">
            <nav className="flex h-14 items-center border-b border-gray-200 bg-white px-6 lg:px-8">
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
            </nav>

            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-[480px]">
                    <div className="mb-6 text-center">
                        <h1 className="mb-2 text-[26px] font-semibold text-contrast-black">
                            See your offers
                        </h1>
                        <p className="text-[14px] leading-relaxed text-[#677178]">
                            Enter the code from your mailer and the last four digits of your
                            Social Security number to view the offers reserved for you.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8"
                    >
                        <div className="mb-5">
                            <label
                                htmlFor="promo-code"
                                className="mb-2 block text-[13px] font-medium text-[#374151]"
                            >
                                Promo code
                            </label>
                            <input
                                id="promo-code"
                                value={formatPromoCode(promoCode)}
                                onChange={(e) =>
                                    setPromoCode(e.target.value.replace(/\D/g, "").slice(0, 16))
                                }
                                placeholder="1234 5678 9012 3456"
                                inputMode="numeric"
                                autoComplete="off"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-[15px] tracking-wider text-[#262C30] placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#143C67]"
                            />
                        </div>

                        <div className="mb-6">
                            <label
                                htmlFor="ssn-last-four"
                                className="mb-2 block text-[13px] font-medium text-[#374151]"
                            >
                                Last 4 of SSN
                            </label>
                            <input
                                id="ssn-last-four"
                                value={lastFour}
                                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                placeholder="1234"
                                inputMode="numeric"
                                maxLength={4}
                                autoComplete="off"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-[15px] tracking-[0.3em] text-[#262C30] placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#143C67]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`w-full rounded-full py-3 text-[13px] font-bold uppercase tracking-wider text-white transition-colors ${
                                canSubmit
                                    ? "bg-[#262C30] hover:bg-black"
                                    : "cursor-not-allowed bg-gray-300"
                            }`}
                        >
                            {isSubmitting ? "Verifying…" : "View My Offers"}
                        </button>

                        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#677178]">
                            We use this only to locate the offers reserved for you. Viewing your
                            offers will not affect your credit score.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

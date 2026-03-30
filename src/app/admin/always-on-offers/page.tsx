"use client";

import { useStore } from "@/context/StoreContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export default function AlwaysOnOffersPage() {
    const { products } = useStore();
    // Track which products are toggled on (prototype state only)
    const [activeIds, setActiveIds] = useState<Set<string>>(() => {
        // Default: first 3 active products are toggled on
        const active = products.filter(p => p.isActive).slice(0, 3);
        return new Set(active.map(p => p.id));
    });

    const toggle = (id: string) => {
        setActiveIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const activeCount = activeIds.size;
    const totalCount = products.filter(p => p.isActive).length;

    // Product type to icon mapping
    const getProductIcon = (type: string) => {
        switch (type) {
            case "auto-loan":
            case "auto-refi":
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                );
            case "home-loan":
            case "heloc":
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                );
            case "credit-card":
            case "credit-limit-increase":
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                );
            case "savings":
            case "checking":
            case "money-market":
            case "certificate":
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                );
        }
    };

    const getRateLabel = (type: string) => {
        if (["savings", "checking", "money-market", "certificate"].includes(type)) {
            return "As high as";
        }
        return "As low as";
    };

    const getDisplayRate = (product: typeof products[0]) => {
        const rateAttr = product.attributes.find(a =>
            a.label.toLowerCase().includes("low") ||
            a.label.toLowerCase().includes("high") ||
            a.label.toLowerCase().includes("rate")
        );
        if (rateAttr) return rateAttr.value + (rateAttr.subtext ? ` ${rateAttr.subtext}` : "");
        if (product.attributes.length > 0) return product.attributes[0].value + (product.attributes[0].subtext ? ` ${product.attributes[0].subtext}` : "");
        return null;
    };

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Products & Offers</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Toggle product offers that should be available to everyone, always. These appear as &quot;Apply Now&quot; offers with no targeting or time restrictions.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Always-On Product Offers</h2>
                    <span className="text-xs text-slate-500">{activeCount} of {totalCount} active</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {products.filter(p => p.isActive).map((product) => {
                        const isOn = activeIds.has(product.id);
                        const rate = getDisplayRate(product);

                        return (
                            <div
                                key={product.id}
                                className={cn(
                                    "px-6 py-4 flex items-center justify-between transition-opacity",
                                    !isOn && "opacity-60"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        isOn ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                    )}>
                                        {getProductIcon(product.type)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                                        {rate && (
                                            <p className="text-xs text-slate-500">
                                                {getRateLabel(product.type)}{" "}
                                                <span className="font-medium text-slate-700">{rate}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggle(product.id)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        isOn ? "bg-emerald-600" : "bg-slate-300"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-5 w-5 rounded-full bg-white border-2 transition-transform",
                                            isOn ? "translate-x-5 border-emerald-600" : "translate-x-0.5 border-slate-300"
                                        )}
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-900">How this works</h4>
                        <p className="text-xs text-blue-700 mt-1">
                            Active products show as &quot;Apply Now&quot; offers to all consumers at all times. No targeting, no dates, no file uploads needed.
                            For targeted marketing pushes with specific audiences and timeframes, create an Offer Window instead.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Q2OfferWidget } from "@/components/home-banking/Q2OfferWidget";
import { Q2ComposableWidget } from "@/components/home-banking/Q2ComposableWidget";
import { AlkamiOfferWidget } from "@/components/home-banking/AlkamiOfferWidget";
import { PartnerShell } from "@/components/home-banking/shells/PartnerShell";
import { useDemoStore } from "@/demo/DemoStoreContext";
import { HB_PROVIDERS, isHbProvider } from "@/demo/types";
import type { HbProvider } from "@/demo/types";

/**
 * The DSF widget inside a partner's digital banking product.
 *
 * Shares the partner shells with /home-banking, so the chrome a prospect sees
 * is the same chrome the team prototypes against. The widget tag is suppressed
 * here — it's an internal annotation, not something to show a client.
 *
 * Provider comes from ?provider= so the DemoBar can switch it as a client
 * transition and the surface stays deep-linkable. Only the three providers with
 * working widgets are reachable; NCR/Fiserv remain stubs on /home-banking.
 */
function HomeBankingSurface() {
    const { config } = useDemoStore();
    const searchParams = useSearchParams();

    const param = searchParams.get("provider");
    const provider: HbProvider = isHbProvider(param) ? param : HB_PROVIDERS[0].value;

    return (
        <div className="min-h-screen bg-slate-100 py-8 font-sans">
            <PartnerShell partner={provider} userName={config.memberName}>
                {provider === "q2-totalaccess" && <Q2OfferWidget />}
                {provider === "q2-composable" && <Q2ComposableWidget storefrontHref="/demo/storefront" />}
                {provider === "alkami" && <AlkamiOfferWidget storefrontHref="/demo/storefront" />}
            </PartnerShell>
        </div>
    );
}

export default function DemoHomeBankingPage() {
    return (
        <Suspense fallback={null}>
            <HomeBankingSurface />
        </Suspense>
    );
}

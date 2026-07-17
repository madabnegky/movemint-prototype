"use client";

import { DemoStorefront } from "@/components/demo/DemoStorefront";
import { LandingGate } from "@/components/demo/LandingGate";
import { useDemoStore } from "@/demo/DemoStoreContext";

/**
 * The standalone URL path to the storefront.
 *
 * Identical to /demo/storefront once you're through the door — same component,
 * same layout, same offers. The only difference is how the member got here: this
 * route makes them authenticate first, where /demo/storefront assumes SSO from
 * home banking.
 */
export default function DemoLandingPage() {
    const { config, updateConfig } = useDemoStore();

    if (!config.landingUnlocked) {
        return <LandingGate onUnlock={() => updateConfig({ landingUnlocked: true })} />;
    }

    return <DemoStorefront />;
}

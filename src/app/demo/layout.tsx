"use client";

import { Suspense, useMemo } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_OFFERS } from "@/context/StoreContext";
import { StorefrontDataProvider } from "@/hooks/useStorefrontData";
import { DemoStoreProvider, useDemoStore } from "@/demo/DemoStoreContext";
import { buildDemoStorefrontData } from "@/demo/buildStorefrontData";
import { DemoBar } from "@/components/demo/DemoBar";

/**
 * Owns demo state for every /demo surface.
 *
 * Because setup, landing, storefront, and home-banking are all siblings under
 * this layout, Next preserves this subtree across navigation between them:
 * config survives, with no reload and no flash mid-demo.
 */

/** Bridges demo config into the seam the display components read from. */
function StorefrontDataBridge({ children }: { children: ReactNode }) {
    const { config } = useDemoStore();
    const data = useMemo(
        () => buildDemoStorefrontData(config, DEFAULT_OFFERS),
        [config],
    );
    return <StorefrontDataProvider value={data}>{children}</StorefrontDataProvider>;
}

function DemoChrome() {
    const pathname = usePathname();
    // Setup has its own navigation; the bar would be redundant there.
    if (pathname.startsWith("/demo/setup")) return null;
    return <DemoBar />;
}

export default function DemoLayout({ children }: { children: ReactNode }) {
    return (
        <DemoStoreProvider>
            <StorefrontDataBridge>
                {children}
                {/* useSearchParams needs a Suspense boundary to avoid opting the
                    whole tree out of static rendering. */}
                <Suspense fallback={null}>
                    <DemoChrome />
                </Suspense>
            </StorefrontDataBridge>
        </DemoStoreProvider>
    );
}

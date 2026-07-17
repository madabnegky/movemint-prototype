"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { StorefrontData } from "./useStorefront";

/**
 * Injection seam for storefront data.
 *
 * Most display components (HeroCarousel, Q2OfferWidget, Q2ComposableWidget,
 * AlkamiOfferWidget, CreditMountainCard) call useStorefront() internally and take
 * no props, so there is no way to hand them a different data source from above.
 * This context lets a subtree supply StorefrontData directly: useStorefront()
 * returns the injected value when a provider is present, and otherwise falls back
 * to deriving data from StoreContext as it always has.
 *
 * Used by /demo to render the existing surfaces from demo config without the
 * previewMode/member-profile axes.
 */
const StorefrontDataContext = createContext<StorefrontData | null>(null);

export function StorefrontDataProvider({
    value,
    children,
}: {
    value: StorefrontData;
    children: ReactNode;
}) {
    return (
        <StorefrontDataContext.Provider value={value}>
            {children}
        </StorefrontDataContext.Provider>
    );
}

export function useInjectedStorefrontData(): StorefrontData | null {
    return useContext(StorefrontDataContext);
}

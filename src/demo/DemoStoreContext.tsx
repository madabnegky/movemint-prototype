"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_DEMO_CONFIG } from "./types";
import type { DemoConfig, DemoFlags, DemoOfferRef, DemoSelection } from "./types";

const STORAGE_KEY = "movemint_demo_v1";

interface DemoStoreContextValue {
    config: DemoConfig;
    /** Set when a persist fails (e.g. quota exceeded); surfaced in setup. */
    storageError: string | null;
    updateConfig: (patch: Partial<DemoConfig>) => void;
    setFlags: (patch: Partial<DemoFlags>) => void;
    setSelection: (selection: DemoSelection) => void;
    selectScenario: (scenarioId: string) => void;
    /** Switch to hand-picked mode, restoring the last hand-picked list. */
    useHandpicked: () => void;
    setHandpickedOffers: (offers: DemoOfferRef[]) => void;
    resetConfig: () => void;
}

const DemoStoreContext = createContext<DemoStoreContextValue | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<DemoConfig>(DEFAULT_DEMO_CONFIG);
    const [isInitialized, setIsInitialized] = useState(false);
    const [storageError, setStorageError] = useState<string | null>(null);

    /**
     * Hand-picked offers survive a round trip through scenario mode, so toggling
     * scenario -> hand-picked -> scenario mid-demo doesn't silently discard work.
     * Deliberately not persisted: it's a scratch buffer, not config.
     */
    const lastHandpicked = useRef<DemoOfferRef[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as Partial<DemoConfig>;
                // Spread over defaults so a config saved before a field existed
                // still loads, rather than rendering with the field undefined.
                setConfig({
                    ...DEFAULT_DEMO_CONFIG,
                    ...parsed,
                    flags: { ...DEFAULT_DEMO_CONFIG.flags, ...parsed.flags },
                });
                if (parsed.selection?.mode === "handpicked") {
                    lastHandpicked.current = parsed.selection.offers;
                }
            }
        } catch {
            // Corrupt or unreadable config shouldn't wedge the demo — fall back
            // to defaults and let the sales person reconfigure.
            setConfig(DEFAULT_DEMO_CONFIG);
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (!isInitialized) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            setStorageError(null);
        } catch {
            // A throw here would otherwise break the whole demo mid-pitch. The
            // in-memory config still works; only persistence is lost.
            setStorageError(
                "Couldn't save this configuration — browser storage is full. The demo still works, but settings won't survive a reload.",
            );
        }
    }, [config, isInitialized]);

    const value = useMemo<DemoStoreContextValue>(() => {
        const setSelection = (selection: DemoSelection) => {
            if (selection.mode === "handpicked") lastHandpicked.current = selection.offers;
            setConfig((c) => ({ ...c, selection }));
        };

        return {
            config,
            storageError,
            updateConfig: (patch) => setConfig((c) => ({ ...c, ...patch })),
            setFlags: (patch) => setConfig((c) => ({ ...c, flags: { ...c.flags, ...patch } })),
            setSelection,
            selectScenario: (scenarioId) => setConfig((c) => ({ ...c, selection: { mode: "scenario", scenarioId } })),
            useHandpicked: () => setSelection({ mode: "handpicked", offers: lastHandpicked.current }),
            setHandpickedOffers: (offers) => setSelection({ mode: "handpicked", offers }),
            resetConfig: () => {
                lastHandpicked.current = [];
                setConfig(DEFAULT_DEMO_CONFIG);
            },
        };
    }, [config, storageError]);

    return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore(): DemoStoreContextValue {
    const ctx = useContext(DemoStoreContext);
    if (!ctx) throw new Error("useDemoStore must be used within a DemoStoreProvider");
    return ctx;
}

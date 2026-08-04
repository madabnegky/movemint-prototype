"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { partnerSlug } from "./stages";
import type { Partner, PartnerPatch, PartnerSettings, PartnerState } from "./types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Fields a caller must supply when adding a partner; the rest are defaulted. */
export type NewPartnerInput = Pick<Partner, "name"> &
  Partial<Omit<Partner, "id" | "name" | "createdAt" | "updatedAt">>;

interface PartnerContextValue {
  state: PartnerState | null;
  loading: boolean;
  saveStatus: SaveStatus;
  updatePartner: (
    id: string,
    patch: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>,
  ) => void;
  updatePartners: (
    ids: string[],
    patch: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>,
  ) => void;
  /** Adds a partner and returns the id it was created under locally. The server
   *  may suffix the id on collision, so a refresh follows the write. */
  createPartner: (input: NewPartnerInput) => Promise<string>;
  deletePartner: (id: string) => void;
  updateSettings: (patch: Partial<PartnerSettings>) => void;
  resetToSeed: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextValue | null>(null);

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PartnerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const inflight = useRef(0);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/partners", { cache: "no-store" });
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const send = useCallback(async (patch: PartnerPatch) => {
    inflight.current++;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      inflight.current--;
      if (inflight.current === 0) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1500);
      }
      return true;
    } catch {
      inflight.current--;
      setSaveStatus("error");
      return false;
    }
  }, []);

  const applyLocal = useCallback(
    (ids: string[], patch: Partial<Partner>) => {
      setState((prev) => {
        if (!prev) return prev;
        const now = new Date().toISOString();
        const partners = { ...prev.partners };
        for (const id of ids) {
          const existing = partners[id];
          if (!existing) continue;
          partners[id] = { ...existing, ...patch, id, updatedAt: now };
        }
        return { ...prev, partners, updatedAt: now };
      });
    },
    [],
  );

  const updatePartner = useCallback<PartnerContextValue["updatePartner"]>(
    (id, patch) => {
      applyLocal([id], patch);
      void send({ type: "partner", id, patch });
    },
    [applyLocal, send],
  );

  const updatePartners = useCallback<PartnerContextValue["updatePartners"]>(
    (ids, patch) => {
      applyLocal(ids, patch);
      void send({ type: "partners", ids, patch });
    },
    [applyLocal, send],
  );

  const createPartner = useCallback<PartnerContextValue["createPartner"]>(
    async (input) => {
      const now = new Date().toISOString();
      // Local id guess; the server resolves collisions authoritatively and the
      // refresh below reconciles if it had to suffix.
      const base = partnerSlug(input.name) || `partner-${Date.now()}`;
      let id = base;
      if (state?.partners[id]) {
        let n = 2;
        while (state.partners[`${id}-${n}`]) n++;
        id = `${id}-${n}`;
      }
      const partner: Partner = {
        id,
        name: input.name.trim(),
        companyType: input.companyType ?? "",
        categories: input.categories ?? [],
        stage: input.stage ?? "not-contacted",
        fiReach: input.fiReach ?? { raw: "", value: null, qualifier: "na" },
        reachNotes: input.reachNotes,
        primaryFocus: input.primaryFocus,
        website: input.website,
        notes: input.notes,
        owner: input.owner ?? null,
        revShare: input.revShare,
        sourcedFiIds: input.sourcedFiIds,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) =>
        prev
          ? { ...prev, partners: { ...prev.partners, [id]: partner }, updatedAt: now }
          : prev,
      );
      // The server stamps createdAt/updatedAt itself, so they're omitted here.
      const { createdAt, updatedAt, ...rest } = partner;
      void createdAt;
      void updatedAt;
      await send({ type: "create", partner: rest });
      // Pull the server's view so a collision-suffixed id doesn't linger wrong.
      await refresh();
      return id;
    },
    [send, refresh, state],
  );

  const deletePartner = useCallback<PartnerContextValue["deletePartner"]>(
    (id) => {
      setState((prev) => {
        if (!prev) return prev;
        const partners = { ...prev.partners };
        delete partners[id];
        return { ...prev, partners, updatedAt: new Date().toISOString() };
      });
      void send({ type: "delete", id });
    },
    [send],
  );

  const updateSettings = useCallback<PartnerContextValue["updateSettings"]>(
    (patch) => {
      setState((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, ...patch } } : prev,
      );
      void send({ type: "settings", patch });
    },
    [send],
  );

  const resetToSeed = useCallback(async () => {
    setSaveStatus("saving");
    const res = await fetch("/api/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "reset" } satisfies PartnerPatch),
    });
    if (res.ok) {
      setState(await res.json());
      setSaveStatus("saved");
    } else {
      setSaveStatus("error");
    }
  }, []);

  return (
    <PartnerContext.Provider
      value={{
        state,
        loading,
        saveStatus,
        updatePartner,
        updatePartners,
        createPartner,
        deletePartner,
        updateSettings,
        resetToSeed,
        refresh,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
}

export function usePartners(): PartnerContextValue {
  const ctx = useContext(PartnerContext);
  if (!ctx) throw new Error("usePartners must be used inside PartnerProvider");
  return ctx;
}

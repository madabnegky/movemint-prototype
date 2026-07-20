"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  PipelinePatch,
  PipelineRecord,
  PipelineSettings,
  PipelineState,
} from "./types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface PipelineContextValue {
  state: PipelineState | null;
  loading: boolean;
  saveStatus: SaveStatus;
  updateRecord: (fiId: string, patch: Partial<Omit<PipelineRecord, "fiId" | "updatedAt">>) => void;
  updateRecords: (
    fiIds: string[],
    patch: Partial<Omit<PipelineRecord, "fiId" | "updatedAt">>,
  ) => void;
  updateSettings: (patch: Partial<PipelineSettings>) => void;
  resetToSeed: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PipelineState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const inflight = useRef(0);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/pipeline", { cache: "no-store" });
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const send = useCallback(async (patch: PipelinePatch) => {
    inflight.current++;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/pipeline", {
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
    } catch {
      inflight.current--;
      setSaveStatus("error");
    }
  }, []);

  const applyLocal = useCallback(
    (fiIds: string[], patch: Partial<PipelineRecord>) => {
      setState((prev) => {
        if (!prev) return prev;
        const now = new Date().toISOString();
        const records = { ...prev.records };
        for (const fiId of fiIds) {
          const existing = records[fiId] ?? {
            fiId,
            stage: null,
            owner: null,
            updatedAt: now,
          };
          records[fiId] = { ...existing, ...patch, fiId, updatedAt: now };
        }
        return { ...prev, records, updatedAt: now };
      });
    },
    [],
  );

  const updateRecord = useCallback<PipelineContextValue["updateRecord"]>(
    (fiId, patch) => {
      applyLocal([fiId], patch);
      void send({ type: "record", fiId, patch });
    },
    [applyLocal, send],
  );

  const updateRecords = useCallback<PipelineContextValue["updateRecords"]>(
    (fiIds, patch) => {
      applyLocal(fiIds, patch);
      void send({ type: "records", fiIds, patch });
    },
    [applyLocal, send],
  );

  const updateSettings = useCallback<PipelineContextValue["updateSettings"]>(
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
    const res = await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "reset" } satisfies PipelinePatch),
    });
    if (res.ok) {
      setState(await res.json());
      setSaveStatus("saved");
    } else {
      setSaveStatus("error");
    }
  }, []);

  return (
    <PipelineContext.Provider
      value={{
        state,
        loading,
        saveStatus,
        updateRecord,
        updateRecords,
        updateSettings,
        resetToSeed,
        refresh,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline(): PipelineContextValue {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipeline must be used inside PipelineProvider");
  return ctx;
}

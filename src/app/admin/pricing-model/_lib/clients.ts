import ncuaData from "@/data/ncua-cus.json";
import type { CU } from "./types";

/**
 * Existing-client record. Sourced from CSV upload, persisted in localStorage,
 * and optionally exported to JSON for committing to the repo.
 *
 * `cuNumber` joins to NCUA data when present; if absent or unmatched, the
 * row still works (back-solve uses annual fee + actual event counts directly,
 * no NCUA prefill needed). The user can manually associate an unmatched
 * client to an NCUA CU later.
 */
export type ExistingClient = {
  /** Stable internal id; generated on import. */
  id: string;
  /** NCUA charter number; null if unmatched/manually entered. */
  cuNumber: string | null;
  /** Display name; user-supplied, may differ from NCUA name. */
  name: string;
  /** 2025 annual fee paid to Movemint — the 100% revenue anchor. */
  annualFee2025: number;
  /** Actual event counts from platform activity, full year 2025. */
  redemptionsLending: number;
  redemptionsDeposit: number;
  applicationsLending: number;
  applicationsDeposit: number;
  offersGeneratedLending: number;
  offersGeneratedDeposit: number;
  clicksLending: number;
  clicksDeposit: number;
};

export type ClientWithNcua = ExistingClient & {
  ncua: CU | null;
};

/**
 * Each existing client occupies exactly one of three module modes,
 * inferred from their CSV event counts:
 *   - lending: only lending events present (deposit counts all 0)
 *   - deposit: only deposit events present (lending counts all 0)
 *   - both:    activity on both sides
 *   - none:    no activity at all (rare; treat as "both" so back-solve runs but warn)
 *
 * The mode determines which side of the back-solve runs for that client.
 */
export type ClientMode = "lending" | "deposit" | "both" | "none";

export function clientMode(c: ExistingClient): ClientMode {
  const lendingTotal =
    c.redemptionsLending + c.applicationsLending + c.offersGeneratedLending + c.clicksLending;
  const depositTotal =
    c.redemptionsDeposit + c.applicationsDeposit + c.offersGeneratedDeposit + c.clicksDeposit;
  if (lendingTotal === 0 && depositTotal === 0) return "none";
  if (depositTotal === 0) return "lending";
  if (lendingTotal === 0) return "deposit";
  return "both";
}

export const MODE_LABELS: Record<ClientMode, string> = {
  lending: "Lending-only",
  deposit: "Deposit-only",
  both: "Both modules",
  none: "No activity",
};

const STORAGE_KEY = "pricing-model-clients";

// Cached "current value" for the localStorage-backed clients array. We must
// return a stable reference across renders that don't change the data, or
// useSyncExternalStore will infinite-loop. The cache is invalidated whenever
// we write or receive a `storage` event from another tab.
let _clientsCache: ExistingClient[] | null = null;

function readFromStorage(): ExistingClient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSnapshot(): ExistingClient[] {
  if (_clientsCache === null) _clientsCache = readFromStorage();
  return _clientsCache;
}

function getServerSnapshot(): ExistingClient[] {
  return [];
}

const _subscribers = new Set<() => void>();
function subscribe(callback: () => void): () => void {
  _subscribers.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      _clientsCache = readFromStorage();
      _subscribers.forEach((cb) => cb());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    _subscribers.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** React hook — subscribe to localStorage-backed clients list. */
export const clientsStore = {
  subscribe,
  getSnapshot,
  getServerSnapshot,
};

export function loadClients(): ExistingClient[] {
  return getSnapshot();
}

export function saveClients(clients: ExistingClient[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  _clientsCache = clients;
  _subscribers.forEach((cb) => cb());
}

export function clearClients() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  _clientsCache = [];
  _subscribers.forEach((cb) => cb());
}

/**
 * Hydrate a list of clients with their NCUA data (or null if no match).
 * Pre-builds a Map keyed by CU number so repeated lookups are O(1).
 */
let _ncuaIndex: Map<string, CU> | null = null;
function ncuaIndex(): Map<string, CU> {
  if (!_ncuaIndex) {
    _ncuaIndex = new Map(ncuaData.cus.map((c) => [c.cu, c]));
  }
  return _ncuaIndex;
}

export function attachNcua(c: ExistingClient): ClientWithNcua {
  const ncua = c.cuNumber ? (ncuaIndex().get(c.cuNumber) ?? null) : null;
  return { ...c, ncua };
}

// ---------- CSV parsing ----------

export type CsvParseResult = {
  clients: ExistingClient[];
  warnings: string[]; // human-readable warnings (e.g. unmatched cu_number)
  errors: string[];   // hard errors that caused rows to be skipped
};

export const REQUIRED_CSV_COLUMNS = [
  "cu_number",
  "client_name",
  "annual_fee_2025",
  "redemptions_lending",
  "redemptions_deposit",
  "applications_lending",
  "applications_deposit",
  "offers_generated_lending",
  "offers_generated_deposit",
  "clicks_lending",
  "clicks_deposit",
] as const;

/**
 * Permissive CSV parser supporting quoted fields with embedded commas/newlines.
 * (Same shape as the NCUA parser. Avoiding a deps add for this.)
 */
function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toNumber(s: string): number {
  // Strip $, commas, whitespace
  const cleaned = s.replace(/[$,\s]/g, "");
  if (cleaned === "" || cleaned === "-") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function parseCsv(text: string): CsvParseResult {
  const rows = parseCsvText(text.trim());
  const warnings: string[] = [];
  const errors: string[] = [];

  if (rows.length < 2) {
    return {
      clients: [],
      warnings,
      errors: ["CSV is empty or has no data rows. Provide a header row plus at least one client."],
    };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx: Record<string, number> = {};
  REQUIRED_CSV_COLUMNS.forEach((col) => {
    const i = header.indexOf(col);
    if (i === -1) {
      errors.push(`Missing required column: ${col}`);
    } else {
      idx[col] = i;
    }
  });
  if (errors.length > 0) {
    return { clients: [], warnings, errors };
  }

  const ncua = ncuaIndex();
  const clients: ExistingClient[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.every((c) => c.trim() === "")) continue; // skip blank lines

    const rawCuNumber = (row[idx.cu_number] ?? "").trim();
    const clientName = (row[idx.client_name] ?? "").trim();
    if (!clientName) {
      errors.push(`Row ${r + 1}: client_name is required`);
      continue;
    }

    const cuNumber = rawCuNumber || null;
    if (cuNumber && !ncua.has(cuNumber)) {
      warnings.push(
        `Row ${r + 1} (${clientName}): cu_number "${cuNumber}" not found in NCUA data — accepted, but you can associate it manually later.`,
      );
    }

    clients.push({
      id: cryptoRandomId(),
      cuNumber,
      name: clientName,
      annualFee2025: toNumber(row[idx.annual_fee_2025] ?? "0"),
      redemptionsLending: toNumber(row[idx.redemptions_lending] ?? "0"),
      redemptionsDeposit: toNumber(row[idx.redemptions_deposit] ?? "0"),
      applicationsLending: toNumber(row[idx.applications_lending] ?? "0"),
      applicationsDeposit: toNumber(row[idx.applications_deposit] ?? "0"),
      offersGeneratedLending: toNumber(row[idx.offers_generated_lending] ?? "0"),
      offersGeneratedDeposit: toNumber(row[idx.offers_generated_deposit] ?? "0"),
      clicksLending: toNumber(row[idx.clicks_lending] ?? "0"),
      clicksDeposit: toNumber(row[idx.clicks_deposit] ?? "0"),
    });
  }

  return { clients, warnings, errors };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function buildSampleCsv(): string {
  // Tiny realistic example to download as a starter file.
  // Funnel: offers_generated → clicks → applications → redemptions
  const lines: string[] = [
    REQUIRED_CSV_COLUMNS.join(","),
    `50377,"Morris Sheppard Texarkana FCU",48000,420,180,1100,520,8400,3600,2200,1100`,
    `,"Anonymous Client (no NCUA match yet)",72000,650,300,1700,820,12000,5500,3400,1650`,
  ];
  return lines.join("\n") + "\n";
}

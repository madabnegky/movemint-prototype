#!/usr/bin/env node
// Fetches ALL active FDIC-insured banks (no asset floor) into a slim
// universe file for the sales pipeline tool.
//
// Usage: node scripts/fetch-universe-banks.mjs
// Output: src/data/universe-banks.json
//
// Source: FDIC BankFind API. ASSET is reported in thousands of dollars —
// normalized to dollars here so both universe files use the same unit.

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, "..", "src/data/universe-banks.json");

const API = "https://api.fdic.gov/banks/institutions";
const PAGE = 5000;

async function fetchPage(offset) {
  const url = `${API}?filters=ACTIVE:1&fields=CERT,NAME,CITY,STALP,ASSET&limit=${PAGE}&offset=${offset}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FDIC API ${res.status}: ${await res.text()}`);
  return res.json();
}

const institutions = [];
let offset = 0;
let total = Infinity;
while (offset < total) {
  const page = await fetchPage(offset);
  total = page.meta.total;
  for (const item of page.data) {
    const d = item.data;
    institutions.push({
      id: `bank-${d.CERT}`,
      type: "bank",
      name: String(d.NAME ?? "").trim(),
      city: String(d.CITY ?? "").trim(),
      state: String(d.STALP ?? "").trim(),
      assets: Math.round(Number(d.ASSET ?? 0) * 1000), // thousands → dollars
    });
  }
  offset += PAGE;
  console.log(`Fetched ${institutions.length}/${total}`);
}

institutions.sort((a, b) => b.assets - a.assets);

const output = {
  meta: {
    source: "FDIC BankFind API (api.fdic.gov/banks/institutions, ACTIVE:1)",
    fetchedAt: new Date().toISOString(),
    count: institutions.length,
  },
  institutions,
};

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(output));
const sizeMb = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2);
console.log(`Wrote ${institutions.length} banks to ${OUT_FILE} (${sizeMb} MB)`);

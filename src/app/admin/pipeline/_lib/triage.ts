import triageData from "@/data/pipeline-triage.json";
import type { TriageClass, UnmatchedRow } from "./types";

/** Rows the importer could not attach to a canonical FI, awaiting a human.
 *  Bundled at build time — regenerating it requires a redeploy. */
export const TRIAGE_ROWS = triageData as UnmatchedRow[];

/** Display copy per triage class, ordered most- to least-actionable. */
export const TRIAGE_CLASSES: {
  id: TriageClass;
  label: string;
  hint: string;
}[] = [
  {
    id: "owner-conflict",
    label: "Owner conflict",
    hint: "Duplicate rows named different owners — pick who keeps the account.",
  },
  {
    id: "no-reg-id",
    label: "No Reg ID",
    hint: "No cert or charter number, so the institution can't be identified. Search for it by name.",
  },
  {
    id: "not-in-universe",
    label: "Not in universe",
    hint: "The Reg ID isn't in the current FDIC/NCUA data — likely merged, closed, or mistyped.",
  },
  {
    id: "wrong-registry",
    label: "Wrong registry",
    hint: "The Reg ID is valid but the FI Type points at the wrong registry.",
  },
  {
    id: "unknown-stage",
    label: "Unknown stage",
    hint: "The Funnel Stage value isn't one the pipeline recognizes.",
  },
];

export function classLabel(c?: TriageClass): string {
  return TRIAGE_CLASSES.find((x) => x.id === c)?.label ?? "Unmatched";
}

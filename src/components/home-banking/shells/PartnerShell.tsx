"use client";

import { Q2TotalAccessShell } from "./Q2TotalAccessShell";
import { Q2ComposableShell } from "./Q2ComposableShell";
import { AlkamiShell } from "./AlkamiShell";
import type { PartnerShellProps } from "./types";

export type PartnerShellId = "q2-totalaccess" | "q2-composable" | "alkami";

const SHELLS = {
    "q2-totalaccess": Q2TotalAccessShell,
    "q2-composable": Q2ComposableShell,
    alkami: AlkamiShell,
} as const;

/** Renders the DSF widget inside the given partner's mock chrome. */
export function PartnerShell({
    partner,
    ...props
}: PartnerShellProps & { partner: PartnerShellId }) {
    const Shell = SHELLS[partner];
    return <Shell {...props} />;
}

export { Q2TotalAccessShell, Q2ComposableShell, AlkamiShell };
export type { PartnerShellProps };

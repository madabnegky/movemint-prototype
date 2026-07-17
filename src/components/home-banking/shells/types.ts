import type { ReactNode } from "react";

/**
 * Partner platform chrome that wraps the DSF widget.
 *
 * Each shell is a mock of a specific digital banking product — its sidebar,
 * header, brand, and account furniture — so a demo can show the widget "inside
 * their product". The widget itself is passed as children and reads its own
 * data, so shells stay presentational.
 */
export interface PartnerShellProps {
    /** Member name in the shell's greeting. Each shell has its own fallback. */
    userName?: string;
    /** The amber "DSF Widget" callout. Useful for internal preview, noise in a demo. */
    showWidgetTag?: boolean;
    /** The DSF widget. Note the Composable and Alkami slots are narrow (~240-300px). */
    children: ReactNode;
}

/**
 * Logo intake for the demo config.
 *
 * The whole demo config lives in one localStorage entry, and localStorage caps
 * around 5MB per origin. An un-downscaled logo would blow that budget and take
 * the rest of the config down with it, so every image is capped at 256px on its
 * long edge before storage — comfortably above the ~28px it renders at on a 2x
 * display, and small enough (~10-30KB) to be a rounding error against the quota.
 */

/** Reject source files larger than this before spending time decoding them. */
const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
/** Reject the encoded result if downscaling somehow didn't get it under this. */
const MAX_ENCODED_BYTES = 200 * 1024;
const MAX_EDGE_PX = 256;

export type LogoResult =
    | { ok: true; dataUrl: string }
    | { ok: false; error: string };

export async function processLogoFile(file: File): Promise<LogoResult> {
    if (!file.type.startsWith("image/")) {
        return { ok: false, error: "That file isn't an image. Try a PNG, JPG, or SVG." };
    }
    if (file.size > MAX_SOURCE_BYTES) {
        return {
            ok: false,
            error: `That image is ${formatBytes(file.size)}. Please use one under ${formatBytes(MAX_SOURCE_BYTES)}.`,
        };
    }

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        return { ok: false, error: "Couldn't read that image. It may be corrupt or an unsupported format." };
    }

    try {
        const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return { ok: false, error: "Couldn't process the image in this browser." };

        ctx.drawImage(bitmap, 0, 0, width, height);

        // webp holds transparency and beats png substantially on photographic marks.
        const dataUrl = canvas.toDataURL("image/webp", 0.92);

        if (estimateDataUrlBytes(dataUrl) > MAX_ENCODED_BYTES) {
            return {
                ok: false,
                error: "That logo is too complex to store. Try a simpler image or flat graphic.",
            };
        }
        return { ok: true, dataUrl };
    } finally {
        bitmap.close();
    }
}

/** Byte length of a base64 data URL's payload, without materializing it. */
function estimateDataUrlBytes(dataUrl: string): number {
    const comma = dataUrl.indexOf(",");
    const b64 = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
    const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
    return Math.floor((b64.length * 3) / 4) - padding;
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${Math.round(bytes / 1024)}KB`;
}

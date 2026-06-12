// Cap the base64 length we'll accept so we stay well under the backend's 5 MB
// bodyLimit (base64 ≈ 4/3 of the raw bytes). Oversized captures are dropped
// rather than risking a 413.
const MAX_DATA_URL_LENGTH = 4_500_000;

// Cap the raster density. On a 3× phone dpr:1 looked soft; dpr:2 is retina-sharp
// while WebP keeps the bytes small. Going past 2 buys no visible sharpness for a
// triage screenshot and only risks the size cap (esp. on Safari's PNG fallback).
const MAX_DPR = 2;

const EXCLUDE = ['#modal-root', '#drawer-root'] as const;

/**
 * Snapshot the current screen to a WebP dataURL via snapdom.
 *
 * snapdom (not html-to-image) because the app's brand logo is a CSS-`mask`ed
 * pseudo-element (Screen.module.scss `.headerOverlap::after`) — html-to-image
 * can't render `mask`/`-webkit-mask` and drew it as a grey box; snapdom's
 * SVG-foreignObject engine preserves masks/filters/blend.
 *
 * Format/quality (snapdom config canon 2026): WebP @ q0.85 is ~5–10× smaller
 * than PNG for screen content, so we can afford dpr:2 for crisp text and still
 * stay well under the backend's body limit. `fast`/`compress` are on by default.
 * Safari silently falls back to PNG *inside* `toWebp`, so we read the real mime
 * from the dataURL (the backend keys the file extension off it) and, if that
 * fallback blows the size cap, we re-raster once at dpr:1.
 *
 * Best-effort by design: any failure resolves to `null` so the bug report still
 * sends (text + route always make it through). The library is imported lazily so
 * it never ships in the main bundle.
 *
 * `exclude` drops the modal/drawer portals: the bug-report form opens BEFORE
 * this capture runs (snappy UX — the modal shows a spinner meanwhile), so we
 * must remove its overlay from the body snapshot or it would appear in its own
 * screenshot. Excluding by portal id is timing-independent.
 */
export async function captureScreenshot(): Promise<string | null> {
  try {
    const { snapdom } = await import('@zumer/snapdom');

    const grab = async (dpr: number): Promise<string | null> => {
      const result = await snapdom(document.body, {
        dpr,
        exclude: [...EXCLUDE],
        excludeMode: 'remove',
      });
      const img = await result.toWebp({ quality: 0.85 });
      const url = img.src;
      return url && url.startsWith('data:image/') ? url : null;
    };

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    let dataUrl = await grab(dpr);

    // Oversized (dense page, or Safari's PNG fallback at dpr:2) → re-raster at 1.
    if (dataUrl && dataUrl.length > MAX_DATA_URL_LENGTH && dpr > 1) {
      dataUrl = await grab(1);
    }
    if (!dataUrl) return null;
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      console.warn('[bug-report] screenshot too large, dropping', dataUrl.length);
      return null;
    }
    return dataUrl;
  } catch (err) {
    console.warn('[bug-report] screenshot capture failed', err);
    return null;
  }
}

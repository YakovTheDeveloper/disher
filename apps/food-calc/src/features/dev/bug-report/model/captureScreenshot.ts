// Cap the base64 length we'll accept so we stay well under the backend's 5 MB
// bodyLimit (base64 ≈ 4/3 of the raw bytes). Oversized captures are dropped
// rather than risking a 413.
const MAX_DATA_URL_LENGTH = 4_500_000;

/**
 * Snapshot the current screen to a PNG dataURL via snapdom.
 *
 * snapdom (not html-to-image) because the app's brand logo is a CSS-`mask`ed
 * pseudo-element (Screen.module.scss `.contentHeader::after`) — html-to-image
 * can't render `mask`/`-webkit-mask` and drew it as a grey box; snapdom's
 * SVG-foreignObject engine preserves masks/filters/blend.
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
    const result = await snapdom(document.body, {
      scale: 1,
      // Without this snapdom rasterizes at devicePixelRatio (2–3× the bytes on
      // retina / mobile) → easy to blow past MAX_DATA_URL_LENGTH.
      dpr: 1,
      exclude: ['#modal-root', '#drawer-root'],
      excludeMode: 'remove',
    });
    const img = await result.toPng();
    const dataUrl = img.src;
    if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;
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

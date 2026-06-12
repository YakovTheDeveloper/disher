// Self-hosted webfonts — bundled by Vite → emitted to dist/assets → precached by the PWA
// (vite.config workbox globPatterns includes woff2) → render correctly OFFLINE.
// Replaces the render-blocking Google Fonts @import removed from index.scss on 2026-06-01
// (design-consistency-plan Phase 0; offline + Core-Web-Vitals).
//
// STATIC @fontsource packages keep PLAIN family names ('Jost', 'Source Serif 4', 'Raleway'),
// matching the --font-* token stacks AND the ~90 hardcoded font-family literals already in the
// SCSS — so no module churn. Each weight file bundles every subset incl. Cyrillic (RU UI).

// Body — Jost (--font-sans)
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/600.css';
import '@fontsource/jost/700.css';
import '@fontsource/jost/400-italic.css';
import '@fontsource/jost/500-italic.css';

// Big numerals only — Onest 800 (--font-big-numeric). Used by the TimeChoose
// dial + ProductQuantity giant digit, where Jost's geometric figures read worse
// than Onest's. The @font-face registers ALL subsets but the browser downloads
// only the latin one (~14.6 KB) since these spots render digits + ':' — cyrillic
// never fetched. Body stays Jost; this is a surgical numeric face, not a revert.
import '@fontsource/onest/800.css';

// Headings — Source Serif 4 (--heading-font); italic is the canon section/overlay voice
import '@fontsource/source-serif-4/300.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/700.css';
import '@fontsource/source-serif-4/300-italic.css';
import '@fontsource/source-serif-4/600-italic.css';
import '@fontsource/source-serif-4/700-italic.css';

// Accent serif — Alice (--font-alice). One weight (400); bundles cyrillic +
// latin subsets. Used by the analysis loader caption; also a --heading-font
// variant option (heading-font-variants.scss).
import '@fontsource/alice/400.css';

// Display accents — Raleway (--font-display)
import '@fontsource/raleway/200.css';
import '@fontsource/raleway/400.css';
import '@fontsource/raleway/500.css';

// Serif fallback — Merriweather (--font-serif, also fallback in --heading-font)
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/700.css';

// Monospace — Ubuntu Mono (--font-mono)
import '@fontsource/ubuntu-mono/400.css';

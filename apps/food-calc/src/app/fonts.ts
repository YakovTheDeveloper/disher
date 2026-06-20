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

// Pilot (2026-06-14): Onest as the body face on the «Мои открытия» slide ONLY
// (scoped via Laboratory `.ambientSheet` → `--font-sans`). Weights the analysis
// cards use: 400 body, 500 chips/meta, 600 titles. Higher x-height + cyrillic-
// native → reads better than Jost on dense text. If the pilot is rejected, drop
// these three imports (and the `.ambientSheet` font block).
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';

// Quiet serif tier — Source Serif 4: italic for Text variant="navTabQuiet"
// (inactive tab / breadcrumb step) + FieldLabel. NOT the heading voice — that is
// Onest bold-sans via --heading-font (flip 2026-06-19).
import '@fontsource/source-serif-4/300.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/700.css';
import '@fontsource/source-serif-4/300-italic.css';
import '@fontsource/source-serif-4/600-italic.css';
import '@fontsource/source-serif-4/700-italic.css';

// Accent serif — Alice (--font-alice). One weight (400); bundles cyrillic +
// latin subsets. Used for the analysis loader caption — NOT the heading voice
// (that is Onest bold-sans via --heading-font since the 2026-06-19 flip).
import '@fontsource/alice/400.css';

// Display accents — Raleway (--font-display)
import '@fontsource/raleway/200.css';
import '@fontsource/raleway/400.css';
import '@fontsource/raleway/500.css';

// Serif fallback — Merriweather (--font-serif; fallback in the quiet serif tier,
// e.g. Text navTabQuiet 'Source Serif 4','Merriweather',serif)
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/700.css';

// Monospace — Ubuntu Mono (--font-mono)
import '@fontsource/ubuntu-mono/400.css';

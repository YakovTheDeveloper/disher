// Self-hosted webfonts — bundled by Vite → emitted to dist/assets → precached by the PWA
// (vite.config workbox globPatterns includes woff2) → render correctly OFFLINE.
// Replaces the render-blocking Google Fonts @import removed from index.scss on 2026-06-01
// (design-consistency-plan Phase 0; offline + Core-Web-Vitals).
//
// STATIC @fontsource packages keep PLAIN family names ('Onest', 'Source Serif 4', 'Raleway'),
// matching the --font-* token stacks. Each weight file bundles every subset incl. Cyrillic (RU UI).

// Onest — теперь ГЛАВНОЕ текстовое семейство (2026-06-22): тело всего приложения
// (--font-sans → --sys-text-family-sans), заголовки (--heading-font, вес 700) и
// крупные цифры (--font-big-numeric, вес 800). На Apple системный SF Pro стоит в
// стеке первым; Onest — fallback вне Apple (Windows/Android), поэтому грузим все
// веса, что реально использует тело+заголовки: 300 (light) · 400 · 500 · 600 ·
// 700 (heading + bold body) · 800 (big-numeric). @fontsource регистрирует все
// subset'ы, браузер тянет нужный (RU UI → cyrillic).
// NB: Onest БЕЗ курсива — body `font-style: italic` вне Apple = faux-oblique
// (принято осознанно; настоящий курсив несёт serif-ярус Source Serif). Jost
// полностью выпилен 2026-06-23 (тело + поля = Onest-led --font-sans).
import '@fontsource/onest/300.css';
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';
import '@fontsource/onest/700.css';
import '@fontsource/onest/800.css';

// Quiet serif tier — Source Serif 4: italic for Text variant="navTabQuiet"
// (inactive tab / breadcrumb step) + variant="sectionLabel" (nutrient section
// headers). NOT the heading voice — that is Onest bold-sans via --heading-font
// (flip 2026-06-19). FieldLabel left this tier for sans on 2026-06-23.
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

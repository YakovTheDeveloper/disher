// Self-hosted webfonts — bundled by Vite → emitted to dist/assets → precached by the PWA
// (vite.config workbox globPatterns includes woff2) → render correctly OFFLINE.
// Replaces the render-blocking Google Fonts @import removed from index.scss on 2026-06-01
// (design-consistency-plan Phase 0; offline + Core-Web-Vitals).

// Onest — ГЛАВНОЕ текстовое семейство: тело (--font-sans → --sys-text-family-sans),
// заголовки (--heading-font, вес 700), крупные цифры (--font-big-numeric, вес 800),
// тихий ярус (вес 200).
//
// ⚠️ ВАРИАТИВНЫЙ пакет регистрирует семейство С СУФФИКСОМ — "Onest Variable", НЕ "Onest".
// Все стеки в tokens.scss обязаны называть его именно так, иначе молчаливый откат на
// Golos Text / system.
//
// Ось wght: 100–900 в одном файле на сабсет → 4 файла (latin, latin-ext, cyrillic,
// cyrillic-ext) вместо 24 статических. Покрывает ВСЕ живые веса разом, поэтому
// «забыли импортировать вес» как класс ошибки больше не существует.
//
// NB: Onest БЕЗ курсива — `font-style: italic` вне Apple = faux-oblique (осознанно).
import '@fontsource-variable/onest';

// Monospace — Ubuntu Mono (--font-mono): ItemsList, FoodEntryCreateModals, BugReportModal.
import '@fontsource/ubuntu-mono/400.css';

// Выпилены 2026-07-14 вместе с 85 woff2 (1.3 MB → 0.2 MB precache):
//   · Source Serif 4 — единственным потребителем остался глиф «i» в InfoIcon;
//     serif-ярус (--sys-text-family-serif) переведён на системную Georgia,
//     которая несёт НАСТОЯЩИЙ курсив и стоит 0 байт.
//   · Raleway (--font-display) — жил в одной строке NutrientEditRow; та переведена
//     на --sys-field-font-family (остальная тройка field-токенов там уже стояла).
//   · Merriweather — фолбэк ЗА self-hosted Source Serif ⇒ не рендерился никогда.
//   · Alice (--font-alice) — ноль потребителей: подпись FabricLoader давно едет
//     на <Text role="body">, комментарий про Alice врал.

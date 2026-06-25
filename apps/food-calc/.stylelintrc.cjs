// Stylelint gate — sys-only per-property token contract (2026-06-24, supersedes the
// 2026-06-01 "must be a variable" gate).
//
// LAW: a gated CSS property accepts ONLY a semantic `var(--sys-…)` token of its
// matching type, plus structural keywords. Raw literals (`#fff`, `rgba(...)`, `14px`),
// reference-tier primitives (`--ref-*`) AND legacy families pending rename
// (`--color-ink`, `--radius-lg`, `--text-sm`, `--cta-*`, `--press-*`, `--duration-*`,
// `--easing-*`) are ALL rejected — each must be renamed to / minted as a `--sys-*` role.
// ignoreVariables:false turns each per-property array into a whitelist, so a bare
// var() no longer auto-passes (that was the tier-skip hole). This fuses what used to
// take two gates (strict-value "is a var" + check-token-tier "not --ref-*") into one.
//
// NOT-YET-MINTED: `--sys-text-size-*`, `--sys-duration-*`, `--sys-easing-*` and radius
// rungs for 16/24/40 don't exist yet — font-size/motion/large-radius usages therefore
// reject until those roles land (see tds/ANALYSIS/property-token-contract-2026-06-24.md)
// and sit in the baseline meanwhile.
//
// Ratchet (храповик): primitive token-файлы exempt forever; current violators are
// amnestied in ./stylelint-legacy-baseline.cjs and shrink on touch. New/touched files
// must comply. Regenerate after large refactors: `npm run lint:style:baseline`.
//
// Gradients in `background` / `background-image` stay allowed (stripe-fork canon) —
// `background` is gated DIRECTLY with a gradient allowance, NOT via expandShorthand
// (which flags `background: linear-gradient(…)` and would break the canon).

let legacyBaseline = [];
if (!process.env.STYLELINT_BASELINE_REGEN) {
  try {
    legacyBaseline = require('./stylelint-legacy-baseline.cjs');
  } catch {
    legacyBaseline = [];
  }
}

/** @type {import('stylelint').Config} */
module.exports = {
  customSyntax: 'postcss-scss',
  plugins: ['stylelint-declaration-strict-value'],
  // `__fixtures__/**` — design-tooling test fixtures intentionally carry raw
  // literals (the detector's known-bad / codemod input cases); never gate them.
  ignoreFiles: ['dist/**', 'dev-dist/**', 'coverage/**', 'playwright-report/**', '**/node_modules/**', '**/__fixtures__/**'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/', //           color, background-color, border-color, outline-color, …
        '/^(fill|stroke)$/', //  SVG paint
        'background', //         shorthand — solid raw colors caught, gradients allowed
        // border-radius shorthand + the 4 corner longhands. A bare literal key
        // ('border-radius') matched the shorthand ONLY — the per-corner longhands
        // (border-top-left-radius …) slipped the gate entirely (DrawerLayout shipped
        // `border-top-left-radius: var(--radius-2xl)` past it). Regex closes that hole.
        '/^border(-(top|bottom)-(left|right))?-radius$/',
        'box-shadow',
        'font-size',
        '/duration$/', //        transition-duration, animation-duration
        '/timing-function$/', // transition/animation-timing-function
      ],
      {
        // false → a bare var() no longer auto-passes; the per-property array below is
        // the WHITELIST. Only a `var(--sys-…)` of the right family + the listed
        // structural keywords pass. Raw literals, --ref-* and legacy families fail.
        ignoreVariables: false,
        // false → raw rgba()/hsl()/#hex inside a function are flagged too.
        ignoreFunctions: false,
        disableFix: true,
        // Per-property whitelist (DTCG type → matching --sys-* family). A regex key
        // (e.g. `/color$/`) matches every property ending that way; literal keys win
        // for exact properties. Keywords live INSIDE each array (no shared catch-all —
        // the plugin does not merge a '' key, verified empirically).
        // Surface-component бандлы (`--sys-field-*` поля, `--sys-card-*` карточки,
        // `--sys-chip-*` чипы) — легитимный SURFACE-ярус компонентов (память
        // surface-and-tier-gates; иерархия Background→Surface). Имя по оси
        // «семейство-поверхности», не «тип», поэтому благословлены по префиксу
        // здесь дополнительно к `--sys-<type>-*` (решение юзера 2026-06-24 §batch.1).
        ignoreValues: {
          '/color$/': ['/^var\\(--sys-color-/', '/^var\\(--sys-field-/', '/^var\\(--sys-card-/', '/^var\\(--sys-chip-/', 'transparent', 'currentColor', 'currentcolor', 'inherit', 'initial', 'unset'],
          '/^(fill|stroke)$/': ['/^var\\(--sys-color-/', 'none', 'transparent', 'currentColor', 'currentcolor', 'inherit'],
          // gradients (stripe-fork canon) allowed; solid raw colors + legacy var() rejected.
          // currentColor blessed (фон-хайрлайн/точка красится текстом — §batch.2).
          background: ['/gradient/i', '/^var\\(--sys-/', 'none', 'transparent', 'currentColor', 'currentcolor', 'inherit', 'initial', 'unset'],
          '/^border(-(top|bottom)-(left|right))?-radius$/': ['/^var\\(--sys-radius-/', '/^var\\(--sys-field-radius/', '0', '50%', 'inherit', 'initial', 'unset'],
          'box-shadow': ['/^var\\(--sys-elevation-/', '/^var\\(--sys-field-shadow/', 'none', 'inherit', 'initial', 'unset'],
          // --sys-text-size-* (escape для не-прозовых размеров) + --sys-field-font-size (поля #1)
          // + --sys-numeral-* (числовой ярус примитива <Numeral>) + --sys-icon-size-* (глиф-иконки).
          'font-size': ['/^var\\(--sys-text-size-/', '/^var\\(--sys-field-font-size/', '/^var\\(--sys-numeral-/', '/^var\\(--sys-icon-size-/', 'inherit', 'initial', 'unset'],
          // --sys-duration-* / --sys-easing-* not minted yet (mechanical aliases pending).
          '/duration$/': ['/^var\\(--sys-duration-/', '0s', '0ms', '0', 'inherit', 'initial', 'unset'],
          '/timing-function$/': ['/^var\\(--sys-easing-/', 'inherit', 'initial', 'unset', 'step-start', 'step-end'],
        },
      },
    ],
  },
  overrides: [
    {
      // primitive layer — raw values ARE the source of truth here
      files: [
        '**/shared/assets/style/tokens.scss',
        '**/shared/assets/style/palette.scss',
        '**/shared/assets/style/surfaces.scss',
        '**/shared/assets/style/themes.scss',
        '**/shared/assets/style/design-variant-palettes.scss',
        '**/shared/assets/style/heading-font-variants.scss',
        '**/shared/assets/style/mixin.scss',
        '**/shared/assets/style/index.scss',
      ],
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
    {
      // dev-tooling design system — отдельная редсистема `--s-*`/`--uk-*`/`--role-*`/
      // `--s-size-*` (НЕ app sys-токены; память dev-tools-design-system). Эти витрины
      // (предложки s_*, ui-kit, suggestion-страница, DesignVariantsBar) НАМЕРЕННО не
      // подчиняются app-контракту — sys-only гейт к ним не применяется (решение
      // юзера 2026-06-24, см. property-token-contract §census/Q4). Exempt навсегда.
      files: [
        '**/app/development-features/**/*.{scss,css}',
        '**/app/ui/DesignVariantsBar/**/*.{scss,css}',
        '**/pages/suggestion/**/*.{scss,css}',
        '**/pages/ui-kit/**/*.{scss,css}',
        // features/dev/** — dev-only инструменты (BugReportModal: тёмная bespoke
        // сцена + ReactMarkdown-вывод + mono технический текст, непереносимый в
        // sans-примитивы). Отдельная dev-редсистема как и витрины выше (решение
        // юзера 2026-06-25). Exempt навсегда, масштабируется на будущие dev-тулзы.
        '**/features/dev/**/*.{scss,css}',
      ],
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
    {
      // third-party library chrome — стилизация ЧУЖОГО DOM (sonner-тостер) через
      // :global(.toast*) + !important. Не компоненты приложения (обернуть в примитив
      // нечего), своя toast-брендовая палитра (--toast-success/error/… — яркие, ≠
      // app-status). genuinely-системный exempt (как dev-редсистема). Решение 2026-06-25.
      files: ['**/shared/assets/style/toaster.scss'],
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
    {
      // legacy baseline — temporary amnesty, shrinks on touch (TODO: tokenize)
      files: legacyBaseline,
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
  ],
};

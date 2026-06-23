// Stylelint gate — design-consistency-plan Phase 1 (2026-06-01).
//
// One rule: `color` / `*-color` / `font-size` / `border-radius` must resolve to a
// variable (CSS custom property `var(--x)`, SCSS `$x`, or a function that contains
// one) — never a raw literal (`#fff`, `rgba(...)`, `14px`, `12px`). Договорённость
// «держись токенов» становится ошибкой сборки, а не пожеланием.
//
// Ratchet (храповик): primitive token-файлы освобождены навсегда; текущие legacy-
// нарушители амнистированы списком в ./stylelint-legacy-baseline.cjs и убывают по
// касанию. Новый/тронутый файл обязан быть на токенах. Пересобрать baseline после
// крупных рефакторингов (напр. FSD-flatten): `npm run lint:style:baseline`.
//
// Gradients in `background` / `background-image` are intentionally NOT gated — the
// stripe-fork canon publishes raw 3-stop gradients (см. CLAUDE.md «Design Philosophy»).

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
      ['/color$/', 'font-size', 'border-radius'],
      {
        // keyword / structural values that carry no design-token meaning
        ignoreValues: [
          'transparent',
          'currentColor',
          'currentcolor',
          'inherit',
          'initial',
          'unset',
          'none',
          '0',
          '50%',
        ],
        // false → raw rgba()/hsl()/#hex are flagged; only var/$var inside a function passes
        ignoreFunctions: false,
        disableFix: true,
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
      // legacy baseline — temporary amnesty, shrinks on touch (TODO: tokenize)
      files: legacyBaseline,
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
  ],
};

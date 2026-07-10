#!/usr/bin/env node
// Token-tier gate (2026-06-24) — "no reference-tier consumption in components".
//
// WHY: disher tokens are 2-tier — ref (raw primitives, `--ref-*` in tokens.scss)
// → sys (semantic decisions, `--sys-*`). Components must read the SEMANTIC tier
// ONLY. Reading `--ref-*` directly (tier-skip) re-forks a value that the sys
// token exists to own: it dodges tone-testers, theming and the single source of
// truth — exactly the mistake that put `var(--ref-color-neutral-100)` on
// ModalShell. A literal grep can't see it (it's a valid var()), so this gate does.
//
// Industry anchor (2026): Mozilla stylelint `no-base-design-tokens` (flag direct
// base-token use, require the semantic tier) + DTCG tier validation (lower tiers
// are not consumed by component code).
//
// SCOPE: only `--ref-*` (the unambiguous reference tier). The palette semantic
// primitives (`--color-*`/`--surface-*`/`--text-*`) are the allowed middle the
// sys tier wraps — out of scope here (and would be noisy). Primitive style files
// (where ref→sys wiring legitimately lives) and dev/showroom surfaces are exempt.
//
// Usage:
//   node scripts/check-token-tier.mjs            # scan all component src styles
//   node scripts/check-token-tier.mjs a.scss …   # scan only these (hook/lint-staged)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const SRC = join(APP, 'src');

// Files allowed to wire ref→sys / hold raw primitives, + dev & showroom surfaces.
const EXEMPT = [
  'assets/style/tokens.scss',
  'assets/style/palette.scss',
  'assets/style/themes.scss',
  'assets/style/theme-dark.scss',
  'assets/style/mixin.scss',
  'assets/style/index.scss',
  'assets/style/design-variant-palettes.scss',
  'development-features/', // dev predlozhka layouts (separate --s-* system)
  'pages/ui-kit/', // design-system showroom
  'pages/suggestion/', // dev suggestion route
];

const REF_USE = /var\(\s*(--ref-[\w-]+)/;

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
}

function walk(dir, acc) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (e.startsWith('s_')) continue; // gitignored dev suggestion scaffolds
      walk(p, acc);
    } else if (p.endsWith('.scss') || p.endsWith('.css')) acc.push(p);
  }
}

function isExempt(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  return EXEMPT.some((e) => norm.includes(e));
}

const allFiles = [];
walk(SRC, allFiles);

const argTargets = process.argv.slice(2).filter((a) => a.endsWith('.scss') || a.endsWith('.css'));
const filesToCheck = (argTargets.length ? argTargets : allFiles).filter(
  (f) => !isExempt(relative(APP, f)),
);

const violations = [];
for (const f of filesToCheck) {
  let text;
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    continue; // removed between staging and check
  }
  stripComments(text)
    .split(/\r?\n/)
    .forEach((line, i) => {
      const m = line.match(REF_USE);
      if (m) violations.push({ file: relative(APP, f), line: i + 1, token: m[1], code: line.trim() });
    });
}

if (violations.length) {
  console.error(`\n✖ ${violations.length} component read(s) of the reference tier (--ref-*):\n`);
  for (const v of violations) console.error(`  ${v.file}:${v.line}  ${v.token}  ${v.code}`);
  console.error(
    '\nComponents read the SEMANTIC tier only. Replace var(--ref-*) with the --sys-* token',
  );
  console.error('that owns it (e.g. --ref-color-navy-600 → --sys-color-bg-selected). Ref→sys');
  console.error('wiring belongs in tokens.scss, not in component styles.');
  process.exit(1);
}

console.log(
  `✓ token tier: ${filesToCheck.length} file(s) checked, no --ref-* read outside the primitive tier`,
);

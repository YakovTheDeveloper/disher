#!/usr/bin/env node
// Channel guard for the typography ROLE mixin (`@include text-role(<роль>)`),
// introduced 2026-06-22 with the --sys-text-* tier (tds/typography-roles-system.md).
//
// Invariant: the 7 semantic type roles (display/headline/title/body/label/caption)
// are applied through the `text-role()` mixin (shared/assets/style/mixin.scss),
// which reads the --sys-text-* composite tokens. To keep typography ENCAPSULATED
// in the primitives (the «голос инкапсулирован в примитиве» canon — project_design_dna
// 2026-06-21), the mixin may be `@include`-d ONLY from the Typography primitives'
// own modules. If arbitrary component .scss start `@include text-role(...)`, the
// roles re-scatter across the codebase and we lose the single application surface
// — exactly the drift this systematization removes.
//
// This gate fails if `@include text-role(` appears in any src style file OUTSIDE
// the allow-list below. To sanction a new consumer, ADD it here WITH a one-line
// reason — that PR-visible edit is the deliberate, reviewed widening.
//
// Note: the token *definitions* (`--sys-text-*` in tokens.scss) and the mixin
// *definition* (mixin.scss) are unaffected — this guards the `@include`, not the
// tokens (their existence is covered by check-scale-tokens.mjs).
//
// Usage:
//   node scripts/check-text-role.mjs            # scan all src/**/*.{scss,css}
//   node scripts/check-text-role.mjs a.scss …   # scan only these (hook/lint-staged)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const SRC = join(APP, 'src');

// Sanctioned consumers — the Typography primitives ONLY. Each entry is a path
// suffix (forward-slash form). Add a new one ONLY with a justification comment.
const ALLOW = [
  'shared/ui/atoms/Typography/Heading/Heading.module.scss', // primitive: <Heading role="…">
  'shared/ui/atoms/Typography/Text/Text.module.scss', //       primitive: <Text role="…">
];

// `@include text-role(` — whitespace-tolerant. Comment mentions are stripped first.
const USE_RE = /@include\s+text-role\s*\(/;

function stripComments(text) {
  // Blank `/* … */` (keep newlines → accurate line numbers) and `// …` so a
  // historical mention in a comment never trips the gate. (Aligned with the
  // other guards.)
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
}

function walk(dir, acc) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith('.scss') || p.endsWith('.css')) acc.push(p);
  }
}

function isAllowed(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  return ALLOW.some((a) => norm.endsWith(a));
}

const allFiles = [];
walk(SRC, allFiles);

const targets = process.argv.slice(2).filter((a) => a.endsWith('.scss') || a.endsWith('.css'));
const filesToCheck = targets.length ? targets : allFiles;

const violations = [];
for (const f of filesToCheck) {
  const rel = relative(APP, f);
  if (isAllowed(rel)) continue;
  let text;
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    continue; // file removed between staging and check — skip
  }
  stripComments(text)
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (USE_RE.test(line)) {
        violations.push({ file: rel, line: i + 1, code: line.trim() });
      }
    });
}

if (violations.length) {
  console.error(`\n✖ ${violations.length} out-of-bounds use(s) of @include text-role():\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.code}`);
  }
  console.error(
    '\ntext-role() applies a semantic type role and must stay encapsulated in the',
  );
  console.error(
    'Typography primitives (<Heading role>/<Text role>). Use the primitive instead of',
  );
  console.error(
    'inlining the role here. To sanction a genuine new consumer, add its path to the',
  );
  console.error('ALLOW list in scripts/check-text-role.mjs with a one-line reason.');
  process.exit(1);
}

console.log(
  `✓ text-role: ${filesToCheck.length} file(s) checked, mixin stays inside the Typography primitives`,
);

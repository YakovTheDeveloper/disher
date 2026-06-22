#!/usr/bin/env node
// Regression guard for the «выбрано» (selected) consolidation (2026-06-22).
//
// Invariant: the single interactive-selected paint flows ONLY through the sys
// tier — `--sys-color-bg-selected` / `--sys-color-text-on-selected` /
// `--sys-color-border-selected` (tokens.scss · ЯРУС sys). The old per-component
// indirection channel `--chip-active-bg` / `--chip-active-border` /
// `--chip-active-text` was a pure pass-through of those sys tokens (ModalShell
// published it, Chip + the press-fill-chip mixin read it with a sys fallback).
// It was collapsed away so the ONLY route to «выбрано» is the sys token directly.
//
// This gate fails if that channel reappears — a declaration `--chip-active-…:`
// or a `var(--chip-active-…)` read anywhere in src styles. Re-adding the channel
// re-opens a second source for «выбрано» (someone could publish it = a non-sys
// value and silently fork the selected color), which is exactly what the
// consolidation removed.
//
// WHY ONLY THE CHANNEL, NOT THE RAW navy LITERAL: `rgba(24,24,105,…)` is an
// OVERLOADED brand value — it is ALSO the action-primary / CTA fill
// (`--sys-color-action-primary` → `--cta-brand-fill`) and an accent, not just
// «выбрано». A literal-level grep cannot tell `.chip.active{background}`
// (selected) from `.confirm{background}` (CTA) — same value, different role. A
// full value-level gate («any selected paint must be the sys token») needs the
// CTA/action navy tokenized first; until then enforcement is structural (this
// channel guard) + the sys-existence guard in check-scale-tokens.mjs.
//
// Usage:
//   node scripts/check-selected-token.mjs            # scan all src/**/*.{scss,css}
//   node scripts/check-selected-token.mjs a.scss …   # scan only these (hook/lint-staged)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const SRC = join(APP, 'src');

// A declaration of the collapsed channel, or a var() read of it. The `[\w-]+`
// after `--chip-active-` requires a real token name, so comment mentions like
// `--chip-active-*` (literal star) or `--chip-active-fill/-border` (no `:`/`var(`)
// do NOT match — only live CSS does.
const DECL_RE = /--chip-active-[\w-]+\s*:/;
const USE_RE = /var\(\s*--chip-active-[\w-]+/;

function stripComments(text) {
  // Blank `/* … */` (keep newlines → accurate line numbers) and `// …` so
  // historical mentions in docs never trip the gate. (Aligned with check-scale-tokens.mjs.)
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

const allFiles = [];
walk(SRC, allFiles);

const targets = process.argv.slice(2).filter((a) => a.endsWith('.scss') || a.endsWith('.css'));
const filesToCheck = targets.length ? targets : allFiles;

const violations = [];
for (const f of filesToCheck) {
  let text;
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    continue; // file removed between staging and check — skip
  }
  stripComments(text)
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (DECL_RE.test(line) || USE_RE.test(line)) {
        violations.push({ file: relative(APP, f), line: i + 1, code: line.trim() });
      }
    });
}

if (violations.length) {
  console.error(
    `\n✖ ${violations.length} reference(s) to the collapsed --chip-active-* channel:\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.code}`);
  }
  console.error(
    '\nThe --chip-active-* indirection was collapsed (2026-06-22). Read «выбрано» from the sys',
  );
  console.error(
    'tier directly: var(--sys-color-bg-selected) / --sys-color-text-on-selected /',
  );
  console.error('--sys-color-border-selected. Do not re-introduce a per-component channel.');
  process.exit(1);
}

console.log(
  `✓ selected token: ${filesToCheck.length} file(s) checked, --chip-active-* channel stays collapsed`,
);

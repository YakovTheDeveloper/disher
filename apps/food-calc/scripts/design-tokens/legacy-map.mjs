#!/usr/bin/env node
// legacy-map.mjs — build a codemod map for legacyVar→sys swaps on gated CSS
// properties (color / border-radius / *duration / *timing-function / background).
//
// The DETECTOR for this category is the live stylelint gate itself (the source of
// truth for what the contract rejects). This tool runs that gate with the baseline
// disabled, parses every `Expected keyword for "<value>" of "<prop>"` warning, and
// classifies each against a CURATED, property-aware legacy→sys table (below). It
// emits a codemod map containing ONLY files where EVERY violation is a proven
// bucket-A swap (file becomes fully clean → drops out of the baseline). Files with
// any out-of-scope / no-role / raw violation are reported but NOT touched.
//
//   node scripts/design-tokens/legacy-map.mjs --out=map.legacy.json   # all src
//   node scripts/design-tokens/legacy-map.mjs --out=map.json src/a.scss …
//
// font-size: prose belongs in <Text>/<Heading> (TSX wave, done by hand). For NON-prose
// (numbers/units/tables) the contract's sanctioned escape is a 1:1 `--sys-text-size-*`
// alias (see FONTSIZE map) — value-equal and typo-safe only on already-typo-baselined
// surfaces. Every emitted swap is still independently proven value-identical by
// equivalence.mjs before it is applied.
import stylelint from 'stylelint';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { loadTokenMap, resolveToken } from './lib.mjs';

// ── Curated property-aware A-map (legacy → sys). Authority: the documented 1:1
//    equivalences in tds/ANALYSIS/property-token-contract-2026-06-24.md. Every
//    entry is re-proven value-equal at runtime before it is allowed into the map.
const COLOR_TEXT = {
  '--text-primary': '--sys-color-text-primary',
  '--text-secondary': '--sys-color-text-secondary',
  '--text-tertiary': '--sys-color-text-tertiary',
  '--text-muted': '--sys-color-text-muted',
  '--text-on-accent': '--sys-color-text-on-accent',
  '--cta-brand-ink': '--sys-color-on-action-primary',
  '--color-ink': '--sys-color-text-primary',
};
const SURFACE = {
  '--surface-base': '--sys-color-surface-page',
  '--surface-bright': '--sys-color-surface-bright',
};
const RADIUS = {
  '--radius-full': '--sys-radius-indicator',
  '--radius-sm': '--sys-radius-control',
  '--radius-md': '--sys-radius-container',
};
const DURATION = {
  '--press-in': '--sys-duration-press-in',
  '--press-out': '--sys-duration-press-out',
  '--duration-fast': '--sys-duration-fast',
  '--duration-normal': '--sys-duration-normal',
  '--duration-slow': '--sys-duration-slow',
  '--duration-ios': '--sys-duration-ios',
};
const EASING = {
  '--easing-default': '--sys-easing-default',
  '--easing-spring': '--sys-easing-spring',
  '--easing-ios': '--sys-easing-ios',
};
const BG = { '--press-tint-bg': '--sys-color-bg-press' };
// font-size escape: legacy --text-* scale → sanctioned --sys-text-size-* (1:1, value-equal).
// Only meaningful for NON-prose elements on already-typo-baselined surfaces (the typo gate
// bans --sys-text-* in component CSS; prose belongs in <Text>/<Heading>, not here).
const FONTSIZE = {
  '--text-xs': '--sys-text-size-xs',
  '--text-sm': '--sys-text-size-sm',
  '--text-base': '--sys-text-size-base',
  '--text-lg': '--sys-text-size-lg',
  '--text-2xl': '--sys-text-size-2xl',
};

function curatedTarget(prop, legacy) {
  const p = prop.toLowerCase();
  if (/color$/.test(p) || p === 'fill' || p === 'stroke') return COLOR_TEXT[legacy];
  if (p === 'border-radius') return RADIUS[legacy];
  if (/font-size/.test(p)) return FONTSIZE[legacy];
  if (/duration$/.test(p)) return DURATION[legacy];
  if (/timing-function$/.test(p)) return EASING[legacy];
  if (p === 'background' || p === 'background-color') return BG[legacy] ?? SURFACE[legacy] ?? COLOR_TEXT[legacy];
  return undefined;
}

const args = process.argv.slice(2);
const outArg = (args.find((a) => a.startsWith('--out=')) ?? '').split('=')[1];
const explicit = args.filter((a) => !a.startsWith('--'));
const files = explicit.length ? explicit : 'src/**/*.{scss,css}';

const map = loadTokenMap();
const resolved = new Map();
for (const name of map.keys()) {
  try { resolved.set(name, resolveToken(name, map).trim().replace(/\s+/g, ' ')); } catch { /* unresolved */ }
}

process.env.STYLELINT_BASELINE_REGEN = '1';
const { results } = await stylelint.lint({ files, configFile: path.resolve('.stylelintrc.cjs') });

const WARN_RE = /Expected keyword for "(.+)" of "(.+)" \(/;
const VARONLY = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/;

function classify(value, prop) {
  const m = value.match(VARONLY);
  if (!m) return { bucket: 'raw/complex', value };
  const legacy = m[1];
  if (legacy.startsWith('--sys-')) return { bucket: 'already-sys', legacy };
  const sys = curatedTarget(prop, legacy);
  if (!sys) return { bucket: 'no-curated-role', legacy };
  if (!resolved.has(sys)) return { bucket: 'sys-missing', legacy, sys };
  if (resolved.get(legacy) !== resolved.get(sys)) {
    return { bucket: 'NOT-EQUIV', legacy, sys, lhs: resolved.get(legacy), rhs: resolved.get(sys) };
  }
  return { bucket: 'A', legacy, sys };
}

const report = [];
for (const r of results) {
  if (!r.warnings.length || !r.source) continue;
  const file = path.relative(process.cwd(), r.source).split(path.sep).join('/');
  const rows = r.warnings.map((w) => {
    const mm = w.text.match(WARN_RE);
    const value = mm ? mm[1] : w.text;
    const prop = mm ? mm[2] : '?';
    return { line: w.line, prop, value, ...classify(value, prop) };
  });
  report.push({ file, rows, allA: rows.every((c) => c.bucket === 'A') });
}

// Emit map ONLY for fully-clearable files (every violation a bucket-A swap).
const entries = [];
for (const f of report) {
  if (!f.allA) continue;
  for (const c of f.rows) {
    entries.push({ file: f.file.split('/').join(path.sep), line: c.line, prop: c.prop, value: c.value, token: `var(${c.sys})` });
  }
}

if (outArg) writeFileSync(outArg, JSON.stringify(entries, null, 2));

// Census to stderr (human-facing; stdout stays the map for piping when no --out).
const clearable = report.filter((f) => f.allA);
const blocked = report.filter((f) => !f.allA);
const blockReasons = new Map();
for (const f of blocked) for (const c of f.rows) if (c.bucket !== 'A') {
  const k = `${c.bucket}|${c.prop}|${c.legacy ?? c.value}`;
  blockReasons.set(k, (blockReasons.get(k) ?? 0) + 1);
}
console.error(`legacy-map: ${clearable.length} fully-clearable file(s), ${entries.length} swap(s); ${blocked.length} blocked.`);
for (const f of clearable) console.error(`  CLEAR ${f.file} (${f.rows.length})`);
if (!outArg) process.stdout.write(JSON.stringify(entries, null, 2) + '\n');

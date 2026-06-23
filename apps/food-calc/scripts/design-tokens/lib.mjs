// lib.mjs — shared primitives for the SCSS design-token tooling (detect / codemod
// / equivalence). The SCSS axis of the systematization (sibling of
// scripts/design-primitives/lib.mjs, the TSX axis). PostCSS + postcss-scss give a
// real declaration AST — no regex parsing of CSS. The ONE walker/resolver every
// tool imports, so detect, codemod and equivalence agree on what "raw spacing" is.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import scss from 'postcss-scss';

const here = dirname(fileURLToPath(import.meta.url));
export const APP = join(here, '..', '..'); // scripts/design-tokens → apps/food-calc
export const SRC = join(APP, 'src');
const STYLE_DIR = join(SRC, 'shared', 'assets', 'style');

/** Spacing call-site properties. padding/margin (+ longhands & logical variants)
 *  and the gap family. NOT inset/top/right/bottom/left — those are positioning,
 *  a separate concern with a different (often non-scale) intent. */
export const SPACING_PROPS = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-block-start', 'padding-block-end',
  'padding-inline', 'padding-inline-start', 'padding-inline-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-block-start', 'margin-block-end',
  'margin-inline', 'margin-inline-start', 'margin-inline-end',
  'gap', 'row-gap', 'column-gap', 'grid-gap', 'grid-row-gap', 'grid-column-gap',
]);

/** The token files in shared/assets/style are the legal raw zone — a `--space-4:
 *  16px` definition there is canonical, not a violation. Detect skips them. */
export function isLegalRawZone(absPath) {
  return absPath.startsWith(STYLE_DIR);
}

export const parseScss = (code) => scss.parse(code);

/** Split a CSS value into top-level whitespace-separated tokens, treating
 *  parens as opaque — `var(--x)` and `calc(1px + 2px)` each stay ONE token, so a
 *  px buried inside calc()/var() is never seen as a bare raw value. */
export function splitTopLevel(value) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') { depth++; cur += ch; }
    else if (ch === ')') { depth--; cur += ch; }
    else if (depth === 0 && /\s/.test(ch)) { if (cur) { out.push(cur); cur = ''; } }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

const PX = /^-?(?:\d+\.\d+|\d+|\.\d+)px$/i;
/** A raw px length that is NOT zero. `0px`/`0` are not scale magic (there is no
 *  --space-0), so they are deliberately not flagged. */
export const isRawPx = (token) => PX.test(token) && parseFloat(token) !== 0;

/** A declaration value carries raw spacing iff any of its TOP-LEVEL tokens is a
 *  non-zero raw px. Shorthands (`16px 8px`) qualify; `0 var(--space-3)` does not. */
export const valueHasRawPx = (value) => splitTopLevel(value).some(isRawPx);

/** Absolute char offset for a 1-based (line, column), via a line-start table. */
export function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}
export const absIndex = (starts, line, column) => starts[line - 1] + (column - 1);

/** The absolute [start, end) range of a declaration's VALUE in the original text.
 *  Computed from the prop start + the `raws.between` (`:`/whitespace) + the parsed
 *  value length — NOT from a re-stringify, so a splice here leaves every other
 *  byte (incl. `//` inline comments postcss-scss would otherwise rewrite) intact. */
export function declValueRange(decl, starts) {
  const propStart = absIndex(starts, decl.source.start.line, decl.source.start.column);
  const start = propStart + decl.prop.length + (decl.raws.between?.length ?? 0);
  return { start, end: start + decl.value.length };
}

function walkScss(dir, acc) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkScss(p, acc);
    else if (p.endsWith('.scss')) acc.push(p);
  }
}
export function allScssFiles() {
  const acc = [];
  walkScss(SRC, acc);
  return acc;
}
export const rel = (absPath) => relative(APP, absPath);

// ─── Token resolution (for equivalence) ──────────────────────────────────────
// Build `--name → declared value` from the canonical token files, then resolve a
// var() (chasing var()-chains to a literal). Used to PROVE a swap is value-exact.
const VAR_RE = /var\(\s*(--[A-Za-z0-9-]+)\s*\)/g;

export function loadTokenMap() {
  const map = new Map();
  for (const f of ['tokens.scss', 'palette.scss', 'themes.scss']) {
    let code;
    try { code = readFileSync(join(STYLE_DIR, f), 'utf8'); } catch { continue; }
    parseScss(code).walkDecls((d) => {
      if (d.prop.startsWith('--')) map.set(d.prop, d.value.trim()); // last definition wins
    });
  }
  return map;
}

export function resolveToken(name, map, seen = new Set()) {
  if (seen.has(name)) throw new Error(`token cycle at ${name}`);
  if (!map.has(name)) throw new Error(`unknown token ${name}`);
  seen.add(name);
  return resolveVars(map.get(name), map, seen);
}

/** Replace every var() in a value string with its resolved literal. */
export function resolveVars(str, map, seen = new Set()) {
  return str.replace(VAR_RE, (_, n) => resolveToken(n, map, new Set(seen)));
}

export const normalizeValue = (v) => v.trim().replace(/\s+/g, ' ');

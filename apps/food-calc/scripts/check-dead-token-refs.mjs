#!/usr/bin/env node
// Dead-reference guard: flag ANY `var(--x)` whose `--x` is never defined — by ANY
// writer, static OR runtime. This is the GENERAL existence gate that closes the hole
// check-scale-tokens.mjs leaves by design (it only knows the 7 static scale/color
// families, so a dangling bespoke ref like `var(--fse-color)` or `var(--card-bg)` to a
// dissolved bundle slips through silently → 0/inherit).
//
// The reason a general gate is HARD — and why the scale gate punted — is the
// "runtime-published token" problem: a custom property can be born in JS, never in CSS.
//   <div style={{ '--item-t': i }} />            // React inline style
//   el.style.setProperty('--search-header-h', …) // imperative
// Those `--x` have NO static `--x:` declaration, yet `var(--item-t)` in SCSS is 100%
// valid. A gate that only reads .scss would flag every one of them — a false-positive
// flood. So this gate harvests definitions from THREE writers before judging a ref:
//   1. SCSS/CSS  `--x: …`  declarations (the static module-root bundles)
//   2. TSX/TS    inline-style keys `'--x':` and `.setProperty('--x', …)` (runtime)
//   3. EXTERNAL  an allowlist of library-published props (Base UI, etc.) — set by the
//      framework at runtime, never declared in our source.
// A ref with a fallback (`var(--x, …)`) is NOT dead (it resolves to the fallback) and is
// skipped. SCSS-interpolated refs (`var(--sys-text-#{$r}-size)`) are composed at compile
// time and skipped (same as the sibling gate).
//
// Usage:
//   node scripts/check-dead-token-refs.mjs                 # scan all src/**/*.{scss,css}
//   node scripts/check-dead-token-refs.mjs a.scss b.scss   # scan only these (hook/lint-staged)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const SRC = join(APP, 'src');

// Props set by libraries at runtime (never declared in our source). A ref to one of
// these is legitimate, not dead. Grow this list as new external producers appear —
// the dry-run surfaces unknowns, you triage each into here or into a real fix.
const EXTERNAL = new Set([
  // Base UI (@base-ui/react) positioner/popup geometry
  '--available-width',
  '--available-height',
  '--anchor-width',
  '--anchor-height',
  '--transform-origin',
  // Base UI useSwipeDismiss — gesture transform written on the Drawer Popup
  '--drawer-swipe-movement-x',
  '--drawer-swipe-movement-y',
]);
// Prefix-based external allowance (e.g. every `--swiper-*`).
const EXTERNAL_PREFIXES = ['--swiper-', '--embla-'];

const TOKEN = '--[A-Za-z][A-Za-z0-9-]*';
const SCSS_DEF_RE = new RegExp(`(${TOKEN})\\s*:`, 'g'); // `--x: …`  custom-property declaration
const JS_STYLE_RE = new RegExp(`['"](${TOKEN})['"]\\s*:`, 'g'); // inline-style object key
const JS_SETPROP_RE = new RegExp(`setProperty\\(\\s*['"](${TOKEN})`, 'g'); // imperative
const USE_RE = new RegExp(`var\\(\\s*(${TOKEN})`, 'g');

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
}

function walk(dir, exts, acc) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (e === 'node_modules' || e === '__fixtures__') continue;
      walk(p, exts, acc);
    } else if (exts.some((x) => p.endsWith(x))) {
      acc.push(p);
    }
  }
}

const styleFiles = [];
const codeFiles = [];
walk(SRC, ['.scss', '.css'], styleFiles);
walk(SRC, ['.tsx', '.ts'], codeFiles);

// Known = every custom property DEFINED by any of the three writers.
const known = new Set(EXTERNAL);
const addDefs = (text, re) => {
  for (const m of text.matchAll(re)) known.add(m[1]);
};
for (const f of styleFiles) addDefs(stripComments(readFileSync(f, 'utf8')), SCSS_DEF_RE);
for (const f of codeFiles) {
  const text = stripComments(readFileSync(f, 'utf8'));
  addDefs(text, JS_STYLE_RE);
  addDefs(text, JS_SETPROP_RE);
}

const isKnown = (name) => known.has(name) || EXTERNAL_PREFIXES.some((p) => name.startsWith(p));

const targets = process.argv.slice(2).filter((a) => a.endsWith('.scss') || a.endsWith('.css'));
const filesToCheck = targets.length ? targets : styleFiles;

const violations = [];
for (const f of filesToCheck) {
  let text;
  try {
    text = stripComments(readFileSync(f, 'utf8'));
  } catch {
    continue; // file removed between staging and check — skip
  }
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(USE_RE)) {
      const name = m[1];
      const after = line[m.index + m[0].length]; // char right after the captured token
      if (after === '#') continue; // SCSS interpolation — name composed at compile time
      if (after === ',') continue; // has a fallback → resolves, not dead
      if (!isKnown(name)) {
        violations.push({ file: relative(APP, f), line: i + 1, name });
      }
    }
  });
}

if (violations.length) {
  console.error(`\n✖ ${violations.length} dead token reference(s) — var() pointing at a never-defined custom property:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  var(${v.name})`);
  }
  console.error('\nFix the name, define the token, add a fallback `var(--x, …)`, or (if a library sets it) add it to EXTERNAL in this script.');
  process.exit(1);
}

console.log(`✓ dead-token-refs: ${filesToCheck.length} style file(s) checked, ${known.size} known tokens, 0 dead refs`);

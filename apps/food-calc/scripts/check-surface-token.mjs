#!/usr/bin/env node
// Surface-root registry gate (2026-06-24).
//
// WHY: the strict-value token gate covers `color`/`*-color`/`font-size`/
// `border-radius` — but NOT the `background` shorthand. That blind spot let
// ModalShell ship a raw cool `#f0f1f4` mono fill, and then (worse) a bespoke
// `--ref-color-neutral-100` tier-skip — neither caught by any gate. A surface's
// base fill is the highest-leverage paint in the app (everything reads on it),
// so it gets its own registry + assertion instead of gating every `background`
// app-wide (which would drown in gradient/tint false-positives).
//
// CONTRACT: every SURFACE ROOT below must paint its base fill with a
// `--sys-color-surface-*` token (one local-alias hop allowed, e.g. Screen's
// `--screen-surface: var(--sys-color-surface-page)`), or `transparent`/`inherit`.
// NEVER a raw literal (#f0f1f4) and NEVER a `--ref-*`/palette primitive
// (`--surface-base`) — that is the tier-skip this gate exists to stop.
//
// Industry anchor (2026): Mozilla stylelint `no-base-design-tokens` + DTCG tier
// validation — components consume the SEMANTIC tier, never the reference tier.
//
// Add a new surface primitive = add one line to SURFACE_ROOTS. The registry IS
// the documented list of "what counts as a surface in disher".
//
// Usage: node scripts/check-surface-token.mjs   (scans the registry; CI/lint-staged)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');

// ── REGISTRY of surface primitives ───────────────────────────────────────────
// { file, selector, note }. `selector` = the element that owns the base fill.
const SURFACE_ROOTS = [
  { file: 'src/shared/ui/Screen/Screen.module.scss', selector: '.screen', note: 'full-page Screen surface' },
  { file: 'src/shared/ui/ModalShell/ModalShell.module.scss', selector: '.wrapper', note: 'modal overlay shell' },
  // ── Input-hosting surface roots (2026-07-15) ──────────────────────────────
  // Each paints a base `--sys-color-surface-*` fill AND hosts field consumers
  // (--sys-field-*), so each ALSO @includes field-depth(<that same token>). The
  // gate below asserts only the base FILL; the field-depth pairing is upheld by
  // the "same token in background + field-depth" convention (mixin.scss #field-depth).
  { file: 'src/shared/ui/DrawerLayout/DrawerLayout.module.scss', selector: '.content', note: 'drawer popup base (hosts drawer-form inputs)' },
  { file: 'src/shared/ui/ModalLayout/ModalLayout.module.scss', selector: '.container', note: 'modal-store modal surface' },
  { file: 'src/shared/ui/WriteBarShell/WriteBarShell.module.scss', selector: '.wrap', note: 'write-bar raised dock (hosts the pill field)' },
  { file: 'src/features/food/food-search/SearchFood.module.scss', selector: '.content', note: 'food-search ambient surface (hosts the search field)' },
  // Select paints its base surface on the PORTALED listbox (`.popup`); the
  // `.trigger` is a field-gradient well, not a base fill — do not register it.
  { file: 'src/shared/ui/atoms/Select/Select.module.scss', selector: '.popup', note: 'Select portaled listbox surface' },
  // Feature cards/modals touched in the field-depth sweep (2026-07-15).
  { file: 'src/entities/nutrient/ui/NutrientCard/NutrientCardEditor.module.scss', selector: '.card', note: 'nutrient card (product-edit hosts NutrientInput)' },
  { file: 'src/features/auth/AuthScreen.module.scss', selector: '.sheet', note: 'auth sheet (hosts AuthForm inputs)' },
  { file: 'src/features/auth/AuthScreen.module.scss', selector: '.screen', note: 'auth fullscreen blocker base' },
  // NOT registered (intentional, see field-depth sweep report):
  //   NumberInput `.input` — deliberately BARE (well painted by a parent row).
  //   BugReportModal `.modal` — intentional glassy-dark override, not a sys surface.
  //   *.compositionBlock / HypothesisListPanel `.well` — base fill is a
  //     `--panel-well` field-GRADIENT, not a plain surface token (not a base fill).
];

// Approved base-fill values: a sys surface token (opt. fallback), or no-paint.
const APPROVED =
  /^(transparent|inherit|initial|none|var\(\s*--sys-color-surface-[\w-]+\s*(?:,[^)]*)?\))$/;

function stripComments(t) {
  return t
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
}

// Map of local `--name: value` declarations, for one-(or-more)-hop alias resolve.
function localVars(src) {
  const map = new Map();
  const re = /(--[\w-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = re.exec(src))) map.set(m[1], m[2].trim());
  return map;
}

function approved(value, vars, seen = new Set()) {
  const v = value.trim();
  if (APPROVED.test(v)) return true;
  const alias = v.match(/^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/);
  if (alias && vars.has(alias[1]) && !seen.has(alias[1])) {
    seen.add(alias[1]);
    return approved(vars.get(alias[1]), vars, seen);
  }
  return false;
}

// Direct-child `background`/`background-color` decls of `selector` blocks
// (depth 0 inside the block — nested rules like `.orb` gradients are skipped).
function surfaceFills(src, selector) {
  const fills = [];
  const sel = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Anchor the surface-root selector at start-of-file, after a closing `}`, or
  // after a `;` — the last case covers a leading `@import '…/mixin.scss';` above
  // the selector (needed once a surface root @includes a field-depth mixin). The
  // registry holds only top-level roots, so `;` can't smuggle in a nested rule.
  const re = new RegExp(`(?:^|\\}|;)\\s*${sel}\\s*\\{`, 'g');
  let m;
  while ((m = re.exec(src))) {
    let depth = 0;
    let buf = '';
    for (let i = re.lastIndex; i < src.length; i++) {
      const c = src[i];
      if (c === '{') { depth++; buf = ''; continue; }
      if (c === '}') { if (depth === 0) break; depth--; buf = ''; continue; }
      if (c === ';') {
        if (depth === 0) {
          const d = buf.match(/(?:^|\s)background(?:-color)?\s*:\s*(.+)/s);
          if (d) fills.push(d[1].trim());
        }
        buf = '';
        continue;
      }
      buf += c;
    }
  }
  return fills;
}

const violations = [];
const drift = [];
for (const root of SURFACE_ROOTS) {
  let src;
  try {
    src = stripComments(readFileSync(join(APP, root.file), 'utf8'));
  } catch {
    drift.push(`${root.file} — cannot read (registry stale? file moved/renamed)`);
    continue;
  }
  const vars = localVars(src);
  const fills = surfaceFills(src, root.selector);
  if (!fills.length) {
    drift.push(`${root.file} ${root.selector} — no background decl found (selector renamed?)`);
    continue;
  }
  for (const f of fills) {
    if (!approved(f, vars)) {
      violations.push(`${root.file}  ${root.selector}  →  background: ${f}`);
    }
  }
}

if (violations.length || drift.length) {
  if (violations.length) {
    console.error(`\n✖ ${violations.length} surface root(s) not on a --sys-color-surface-* token:\n`);
    for (const v of violations) console.error(`  ${v}`);
    console.error(
      '\nA surface base fill MUST be var(--sys-color-surface-*) (one local-alias hop OK)',
    );
    console.error('or transparent/inherit. Not a raw literal, not a --ref-*/primitive (tier-skip).');
  }
  if (drift.length) {
    console.error(`\n✖ ${drift.length} registry-drift issue(s) (update SURFACE_ROOTS):\n`);
    for (const d of drift) console.error(`  ${d}`);
  }
  process.exit(1);
}

console.log(`✓ surface tokens: ${SURFACE_ROOTS.length} surface root(s) on --sys-color-surface-*`);

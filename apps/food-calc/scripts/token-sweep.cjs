#!/usr/bin/env node
// token-sweep.cjs — сплошной механический триаж ВСЕХ scss/css в src/ для скилла /token-audit.
// НЕ гейт (ничего не валит, exit 0) — только классификация в корзины: ГОТОВ / НЕ ГОТОВ /
// НЕТ ТОКЕНОВ / РЕЕСТР. Семантику (канон) скилл досматривает глазами по флагнутым.
//
// Калибровка (см. .claude/commands/token-audit.md → «Калибровка детектора»):
//   bare-raw = #hex / rgb(a) / hsl(a) на gated-свойстве (color/*-color/font-size/border-radius)
//   БЕЗ var( на строке. НЕ сырьё: var(--t,#raw)-фоллбэк · gradient() · box-shadow/background-
//   shorthand (вне гейта) · raw в --token: def (ref-ярус). .css не линтится → css-UNGATED.
//   baseline (stylelint-legacy-baseline.cjs) = амнистия → [B].

const fs = require('fs');
const path = require('path');

const baseline = new Set(require('../stylelint-legacy-baseline.cjs'));
// Primitive layer — MUST mirror the `overrides[0].files` list in .stylelintrc.cjs
// (raw values ARE the source of truth here). Keep in sync if the config changes.
const EXEMPT = new Set(
  ['tokens', 'palette', 'surfaces', 'themes', 'design-variant-palettes', 'heading-font-variants', 'mixin', 'index'].map(
    (n) => `src/shared/assets/style/${n}.scss`,
  ),
);
const RAWVAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/;
const GATED = /^\s*(color|[-a-z]*-color|font-size|border-radius)\s*:/;

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name).split(path.sep).join('/');
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(scss|css)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const b = { ready: [], notready: [], notok: [], registry: [] };
for (const f of walk('src').sort()) {
  const c = fs.readFileSync(f, 'utf8');
  const bare = [];
  c.split(/\r?\n/).forEach((ln, i) => {
    const s = ln.trim();
    if (/^(--|\/\/|\*|\/\*|#\{)/.test(s)) return; // token def / comment / interpolation
    const code = ln.split('//')[0];
    if (code.includes('gradient(')) return; // gradients are not gated
    if (GATED.test(ln) && RAWVAL.test(code) && !code.includes('var(')) bare.push(i + 1);
  });
  const sys = (c.match(/var\(--sys-/g) || []).length;
  const vars = (c.match(/var\(--/g) || []).length;
  // file-level stylelint-disable of strict-value (or disable-all) = sanctioned opt-out,
  // gate honors it like baseline. Inline -line/-next-line don't count.
  const disabled =
    /stylelint-disable(?!-line|-next-line)[^\n]*(declaration-strict-value|scale-unlimited)/.test(c) ||
    /\/\*\s*stylelint-disable\s*\*\//.test(c);
  if (EXEMPT.has(f)) b.registry.push({ f, sys, vars });
  else if (bare.length) b.notready.push({ f, bare, B: baseline.has(f), css: f.endsWith('.css'), disabled });
  else if (vars === 0) b.notok.push({ f });
  else b.ready.push({ f, sys, vars });
}

const nm = (x) => x.f.replace('src/', '');
const total = b.ready.length + b.notready.length + b.notok.length + b.registry.length;
console.log(`SCANNED ${total} scss/css files in src/\n`);
console.log(
  `BUCKETS: ready=${b.ready.length}  not-ready=${b.notready.length}  ` +
    `no-tokens=${b.notok.length}  registry=${b.registry.length}\n`,
);

console.log(`=== NOT-READY (bare-raw color/font/radius) — ${b.notready.length} ===`);
b.notready
  .sort((x, y) => y.bare.length - x.bare.length)
  .forEach((x) => {
    const tag = x.css ? 'css-UNGATED' : x.disabled ? 'disabled' : x.B ? 'baseline' : 'NON-BASE!';
    console.log(`  raw=${String(x.bare.length).padStart(2)} [${tag.padEnd(11)}] ${nm(x)}  L${x.bare.slice(0, 6)}`);
  });

console.log(`\n=== REGISTRY (raw=ref tier; judge by canon) — ${b.registry.length} ===`);
b.registry.forEach((x) => console.log(`  sys=${String(x.sys).padStart(3)} tot=${String(x.vars).padStart(3)}  ${nm(x)}`));

console.log(`\n=== NO-TOKENS (layout-only) — ${b.notok.length} ===`);
b.notok.forEach((x) => console.log(`  ${nm(x)}`));

console.log(`\n=== READY (0 bare-raw, tokenized) — ${b.ready.length} ===`);
b.ready.forEach((x) => console.log(`  sys=${String(x.sys).padStart(3)}/${String(x.vars).padEnd(3)} ${nm(x)}`));

// NON-BASE! in not-ready = gate should have caught it. If gate is green, it's a .css
// (ungated) or a var-fallback false-positive — re-check by eye. Surfaced for the skill:
const susp = b.notready.filter((x) => !x.B && !x.css && !x.disabled);
if (susp.length) {
  console.log(`\n⚠ NON-BASELINE not-ready (verify vs green gate — likely var-fallback false-pos):`);
  susp.forEach((x) => console.log(`  ${nm(x)} L${x.bare.slice(0, 6)}`));
}

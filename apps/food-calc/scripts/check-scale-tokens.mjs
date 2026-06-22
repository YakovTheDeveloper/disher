#!/usr/bin/env node
// Narrow guard against referencing a NON-EXISTENT design token in the finite,
// 100%-static token families. Closes the gap the stylelint strict-value gate
// leaves open: that gate checks a value IS a `var(--x)`, never that `--x` exists,
// so a typo like `var(--space-7)` (the scale skips 7) passes lint and silently
// resolves to nothing → 0 padding / inherited color.
//
// SCOPE — only these families, because they are defined exclusively in static
// .scss/.css (zero runtime/JS-set members), so checking them yields ZERO false
// positives. Runtime-published tokens (--card-*, --cta-*, --drawer-*, …) are
// deliberately NOT checked here. `sys` = the semantic interactive tier
// (tds/interactive-tokens-system.md) — statically declared in tokens.scss and
// scope-overridden in themes.scss; both are .scss DEFINITIONS the walk() picks
// up, so a `var(--sys-…)` typo (silent 0) is caught the same way. `ref` = the
// primitive tier under sys (--ref-shadow-*/--ref-color-* from the elevation+
// palette system, tds/elevation-palette-2026.md) — also static .scss, so a
// `var(--ref-…)` typo is caught identically.
//
// Usage:
//   node scripts/check-scale-tokens.mjs            # scan all src/**/*.{scss,css}
//   node scripts/check-scale-tokens.mjs a.scss b.scss   # scan only these (hook/lint-staged)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const SRC = join(APP, 'src');

const FAMILIES = ['space', 'radius', 'text', 'heading-size', 'color', 'sys', 'ref'];
const FAM = FAMILIES.join('|');
const DEF_RE = new RegExp(`(--(?:${FAM})-[A-Za-z0-9-]+)\\s*:`, 'g');
const USE_RE = new RegExp(`var\\(\\s*(--(?:${FAM})-[A-Za-z0-9-]+)`, 'g');

// Blank out `/* … */` (preserving newlines so line numbers stay accurate) and
// `// …` line comments, so a token mention inside a comment — a definition we
// shouldn't count as "known", or a `var(--…)` ref we shouldn't flag — is ignored.
// (Same helper shape as check-selected-token.mjs.)
function stripComments(text) {
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

// Known = every guarded-family token DEFINED anywhere in the app styles.
const allFiles = [];
walk(SRC, allFiles);
const known = new Set();
const byFamily = {};
for (const f of allFiles) {
  const text = stripComments(readFileSync(f, 'utf8'));
  for (const m of text.matchAll(DEF_RE)) {
    known.add(m[1]);
    const fam = m[1].match(new RegExp(`--(${FAM})-`))[1];
    (byFamily[fam] ??= new Set()).add(m[1]);
  }
}

const targets = process.argv.slice(2).filter((a) => a.endsWith('.scss') || a.endsWith('.css'));
const filesToCheck = targets.length ? targets : allFiles;

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
      if (!known.has(name)) {
        const fam = name.match(new RegExp(`--(${FAM})-`))[1];
        const hint = [...(byFamily[fam] ?? [])].sort().join(', ') || '(none defined)';
        violations.push({ file: relative(APP, f), line: i + 1, name, fam, hint });
      }
    }
  });
}

if (violations.length) {
  console.error(`\n✖ ${violations.length} unknown design token(s) — these var() refs point at a token that is not defined:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  var(${v.name})  — unknown --${v.fam}-* token`);
    console.error(`      known --${v.fam}-*: ${v.hint}\n`);
  }
  console.error('Fix the name or define the token in shared/assets/style. (scale/color families are static — no runtime members.)');
  process.exit(1);
}

console.log(`✓ scale/color tokens: ${filesToCheck.length} file(s) checked, ${known.size} known tokens, 0 unknown refs`);

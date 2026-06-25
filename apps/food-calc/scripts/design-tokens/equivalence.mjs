#!/usr/bin/env node
// equivalence.mjs — static, build-free proof that an approved swap map loses
// nothing: for each entry, resolve every var() in BOTH `token` and the original
// `value` to their literals (chasing var()-chains through tokens.scss/palette.scss/
// themes.scss) and assert the two resolved strings are equal. Resolving a bare
// literal is identity, so this is exact for raw→token spacing swaps (`16px` →
// `var(--space-4)`) AND for legacyVar→sys swaps (`var(--text-primary)` →
// `var(--sys-color-text-primary)`, both resolving to `#221f19`). Unlike the TSX
// axis (where a primitive swap deliberately changes the look), these swaps MUST be
// value-identical or it is a bug.
//
//   node scripts/design-tokens/equivalence.mjs --map=map.json
//
// Output: { ok, checked, mismatches:[{file,line,prop,value,token,resolved,why}] }.
// Exit 1 if not ok. (A full build-diff is unnecessary: --space-* are static
// literals in tokens.scss, so resolving the chain IS the equivalence.)
import { readFileSync } from 'node:fs';
import { loadTokenMap, resolveVars, normalizeValue } from './lib.mjs';

const mapArg = (process.argv.slice(2).find((a) => a.startsWith('--map=')) ?? '').split('=')[1];
if (!mapArg) {
  console.error('equivalence.mjs: --map=<file.json> required');
  process.exit(2);
}
const entries = JSON.parse(readFileSync(mapArg, 'utf8'));
const tokenMap = loadTokenMap();

const mismatches = [];
for (const e of entries) {
  const at = { file: e.file, line: e.line, prop: e.prop, value: e.value, token: e.token };
  let resolved, original;
  try {
    original = resolveVars(e.value, tokenMap); // identity for a raw literal
    resolved = resolveVars(e.token, tokenMap);
  } catch (err) {
    mismatches.push({ ...at, resolved: null, why: err.message });
    continue;
  }
  if (normalizeValue(resolved) !== normalizeValue(original)) {
    mismatches.push({ ...at, resolved, original, why: `resolves to "${resolved}", not the original "${original}"` });
  }
}

const result = { ok: mismatches.length === 0, checked: entries.length, mismatches };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exit(result.ok ? 0 : 1);

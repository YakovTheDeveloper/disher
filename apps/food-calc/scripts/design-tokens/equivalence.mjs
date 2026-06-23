#!/usr/bin/env node
// equivalence.mjs — static, build-free proof that an approved spacing map loses
// nothing: for each entry, resolve every var() in `token` to its literal (chasing
// var()-chains through tokens.scss/palette.scss/themes.scss) and assert the
// resolved string equals the original raw `value`. Unlike the TSX axis (where a
// primitive swap deliberately changes the look), a spacing swap MUST be pixel-
// identical — `var(--space-4)` is exactly `16px` or it is a bug.
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
  let resolved;
  try {
    resolved = resolveVars(e.token, tokenMap);
  } catch (err) {
    mismatches.push({ ...at, resolved: null, why: err.message });
    continue;
  }
  if (normalizeValue(resolved) !== normalizeValue(e.value)) {
    mismatches.push({ ...at, resolved, why: `resolves to "${resolved}", not the original "${e.value}"` });
  }
}

const result = { ok: mismatches.length === 0, checked: entries.length, mismatches };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exit(result.ok ? 0 : 1);

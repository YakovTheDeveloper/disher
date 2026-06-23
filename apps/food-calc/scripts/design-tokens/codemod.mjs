#!/usr/bin/env node
// codemod.mjs — apply an approved map of raw-spacing → token swaps. Deterministic:
// each value is replaced by splicing the ORIGINAL source text at the value's
// computed offset (NOT a re-stringify of the AST), so every other byte — including
// `//` inline comments that postcss-scss would rewrite to `/* */` — is preserved.
//
//   node scripts/design-tokens/codemod.mjs --map=map.json
//
// map.json = [{ file, line, prop, value, token }]
//   file        — path to the .scss (relative to CWD or absolute)
//   line, prop  — locate the declaration; value — its current raw value (asserted)
//   token       — the replacement value string: a single `var(--space-N)` OR a
//                 shorthand of them (`var(--space-6) var(--space-2)`). Whatever the
//                 approval authored; the codemod does an exact, dumb swap.
// A stale map (the asserted `value` no longer at that line/prop) THROWS — never a
// silent mis-edit. Sites outside the map are byte-identical.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseScss, lineStarts, declValueRange } from './lib.mjs';

const mapArg = (process.argv.slice(2).find((a) => a.startsWith('--map=')) ?? '').split('=')[1];
if (!mapArg) {
  console.error('codemod.mjs: --map=<file.json> required');
  process.exit(2);
}
const entries = JSON.parse(readFileSync(mapArg, 'utf8'));
if (!Array.isArray(entries)) {
  console.error('codemod.mjs: map must be a JSON array');
  process.exit(2);
}

// Group by file so each file is parsed once and spliced once.
const byFile = new Map();
for (const e of entries) {
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}

const summary = [];
for (const [file, fileEntries] of byFile) {
  const code = readFileSync(file, 'utf8');
  const starts = lineStarts(code);
  const root = parseScss(code);

  // Resolve each entry to a concrete [start,end) splice on the original text.
  const edits = [];
  for (const e of fileEntries) {
    let decl = null;
    root.walkDecls((d) => {
      if (decl) return;
      if (d.source.start.line === e.line && d.prop === e.prop) decl = d;
    });
    if (!decl) throw new Error(`${file}:${e.line} no ${e.prop} declaration (stale map)`);
    const { start, end } = declValueRange(decl, starts);
    const found = code.slice(start, end);
    if (found !== e.value) {
      throw new Error(`${file}:${e.line} ${e.prop}: expected value "${e.value}", found "${found}" (stale map)`);
    }
    edits.push({ start, end, token: e.token });
  }

  // Apply right-to-left so earlier offsets stay valid as we splice.
  edits.sort((a, b) => b.start - a.start);
  let out = code;
  for (const ed of edits) out = out.slice(0, ed.start) + ed.token + out.slice(ed.end);
  writeFileSync(file, out);
  summary.push({ file, swaps: edits.length });
}

process.stdout.write(JSON.stringify({ files: summary.length, summary }, null, 2) + '\n');

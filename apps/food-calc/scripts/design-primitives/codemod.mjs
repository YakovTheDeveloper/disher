#!/usr/bin/env node
// codemod.mjs — apply an approved map of raw-tag → primitive swaps. Deterministic,
// one pass per file, edits computed from the original AST (no re-scan of written
// text). Touches ONLY the sites in the map; everything else is byte-identical.
//
//   node scripts/design-primitives/codemod.mjs --map=map.json
//
// map.json = [{ file, line, tag, primitive, props, column? }]
//   file      — path to the .tsx (relative to CWD or absolute)
//   line, tag — locate the element (column optional, to disambiguate)
//   primitive — "Heading" | "Text"
//   props     — { as?, role?|size?|variant?, … } serialized as JSX attrs, inserted
//               right after the tag name (so `<h3 className=…>` →
//               `<Heading as="h3" size="card" className=…>`). className/children/
//               handlers on the element are preserved untouched.
//
// The primitive import is ensured per file (merged into the barrel import or added
// fresh) so the output compiles. Idempotent: re-running with the same map and a
// missing site throws (a stale map fails loud, never silently mis-edits).
import { readFileSync, writeFileSync } from 'node:fs';
import { parseTsx, findSite, planJsxEdits, applyEdits, ensureImportEdits } from './lib.mjs';

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

// Group by file so each file is parsed once and rewritten once.
const byFile = new Map();
for (const e of entries) {
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}

const summary = [];
for (const [file, fileEntries] of byFile) {
  const code = readFileSync(file, 'utf8');
  const ast = parseTsx(code);

  const edits = [];
  const primitives = [];
  for (const e of fileEntries) {
    const el = findSite(ast, e); // throws on miss/ambiguity
    const { edits: jsxEdits } = planJsxEdits(el, e);
    edits.push(...jsxEdits);
    primitives.push(e.primitive);
  }
  edits.push(...ensureImportEdits(code, ast, primitives));

  const next = applyEdits(code, edits);
  if (next !== code) writeFileSync(file, next, 'utf8');
  summary.push({ file, sites: fileEntries.length });
}

process.stdout.write(
  JSON.stringify({ files: summary.length, sitesChanged: entries.length, summary }, null, 2) + '\n',
);

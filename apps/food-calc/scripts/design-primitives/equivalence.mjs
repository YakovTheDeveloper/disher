#!/usr/bin/env node
// equivalence.mjs — pre-flight proof that an approved map loses nothing. The TSX
// analog of the SCSS equivalence check, BUT not "the pixels are identical": each
// primitive conversion deliberately changes the look (the role carries the whole
// composite — family+size+weight+lh+tracking). So instead it proves the swap is
// DOM-faithful: nothing the codemod can't see gets dropped. Run on the
// *un-migrated* source (the raw tags are still there).
//
//   node scripts/design-primitives/equivalence.mjs --map=map.json
//
// For each entry it asserts, statically:
//   1. host preserved — the rendered DOM tag (props.as, else the primitive's
//      default host) equals the original tag. Catches `<h3>` silently becoming a
//      default-`h2` <Heading>.
//   2. no children touched — no planned edit range intersects the children span
//      (guaranteed by construction; verified, not trusted).
//   3. no attribute clobbered — no prop key collides with an existing attribute
//      (e.g. a map adding `className` over an existing one).
// Output: { ok, checked, mismatches:[{file,line,tag,why}] }. Exit 1 if not ok.
import { readFileSync } from 'node:fs';
import { parseTsx, findSite, planJsxEdits, attributeNames, PRIMITIVE_DEFAULT_HOST } from './lib.mjs';

const mapArg = (process.argv.slice(2).find((a) => a.startsWith('--map=')) ?? '').split('=')[1];
if (!mapArg) {
  console.error('equivalence.mjs: --map=<file.json> required');
  process.exit(2);
}

const entries = JSON.parse(readFileSync(mapArg, 'utf8'));
const astCache = new Map();
function astFor(file) {
  if (!astCache.has(file)) astCache.set(file, { code: readFileSync(file, 'utf8') });
  const c = astCache.get(file);
  c.ast ??= parseTsx(c.code);
  return c.ast;
}

const mismatches = [];
for (const e of entries) {
  const at = { file: e.file, line: e.line, tag: e.tag };
  let el;
  try {
    el = findSite(astFor(e.file), e);
  } catch (err) {
    mismatches.push({ ...at, why: err.message });
    continue;
  }

  // 1. host tag preserved
  const host = e.props?.as ?? PRIMITIVE_DEFAULT_HOST[e.primitive];
  if (host !== e.tag) {
    mismatches.push({ ...at, why: `host tag changes: <${e.tag}> → <${host}> (pass props.as="${e.tag}")` });
  }

  // 2. no edit range intersects the children span
  const { edits, childrenSpan } = planJsxEdits(el, e);
  if (childrenSpan) {
    const [cs, ce] = childrenSpan;
    const hitsChildren = edits.some((ed) => ed.end > cs && ed.start < ce);
    if (hitsChildren) mismatches.push({ ...at, why: 'an edit would modify the children span' });
  }

  // 3. no prop clobbers an existing attribute
  const existing = new Set(attributeNames(el));
  for (const key of Object.keys(e.props ?? {})) {
    if (existing.has(key)) {
      mismatches.push({ ...at, why: `prop "${key}" collides with an existing attribute (would duplicate/clobber)` });
    }
  }
}

const result = { ok: mismatches.length === 0, checked: entries.length, mismatches };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exit(result.ok ? 0 : 1);

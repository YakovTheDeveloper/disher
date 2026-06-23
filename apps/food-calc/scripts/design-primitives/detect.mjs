#!/usr/bin/env node
// detect.mjs — find raw text-bearing host tags that should become a Typography
// primitive. TSX axis of the typography systematization (sibling of the SCSS
// scripts/design-tokens/detect.mjs). API, not a human report: JSON to stdout.
//
//   node scripts/design-primitives/detect.mjs --category=heading        # scan all src/**/*.tsx
//   node scripts/design-primitives/detect.mjs --category=text a.tsx …   # scan only these (fixtures/staged)
//
// category=heading → <h1>–<h4>; category=text → <p>,<span>. A tag is a hit ONLY
// when it carries text (a non-blank child or a {expr}); an icon-wrapper span
// (`<span><Icon/></span>`) or a comment placeholder is not. The Typography
// primitives, *.test.tsx and *.stories.tsx are excluded (they legally hold raw
// tags). Output: { category, count, sites:[{file,line,column,tag,attrs,hasClassName,open}] }.
// The `open` snippet + line let a human (or the /предложка stage) author the map.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORY_TAGS, isExcluded, isTextBearing, hostTagName, attributeNames, parseTsx, walkNodes } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..', '..');
const SRC = join(APP, 'src');

const args = process.argv.slice(2);
const category = (args.find((a) => a.startsWith('--category=')) ?? '').split('=')[1];
if (!CATEGORY_TAGS[category]) {
  console.error(`detect.mjs: --category=<${Object.keys(CATEGORY_TAGS).join('|')}> required`);
  process.exit(2);
}
const tags = CATEGORY_TAGS[category];

function walk(dir, acc) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith('.tsx')) acc.push(p);
  }
}

const explicit = args.filter((a) => !a.startsWith('--') && a.endsWith('.tsx'));
let files;
if (explicit.length) {
  files = explicit;
} else {
  files = [];
  walk(SRC, files);
}

const sites = [];
for (const f of files) {
  const rel = relative(APP, f);
  if (isExcluded(rel)) continue;
  let code;
  try {
    code = readFileSync(f, 'utf8');
  } catch {
    continue; // removed between listing and read — skip
  }
  let ast;
  try {
    ast = parseTsx(code);
  } catch (err) {
    console.error(`detect.mjs: parse failed for ${rel}: ${err.message}`);
    process.exit(2);
  }
  walkNodes(ast, (n) => {
    if (n.type !== 'JSXElement') return;
    const tag = hostTagName(n);
    if (!tag || !tags.includes(tag) || !isTextBearing(n)) return;
    const o = n.openingElement;
    const attrs = attributeNames(n);
    sites.push({
      file: rel.replace(/\\/g, '/'),
      line: o.loc.start.line,
      column: o.loc.start.column + 1,
      tag,
      attrs,
      hasClassName: attrs.includes('className'),
      open: code.slice(o.range[0], o.range[1]),
    });
  });
}

process.stdout.write(JSON.stringify({ category, count: sites.length, sites }, null, 2) + '\n');

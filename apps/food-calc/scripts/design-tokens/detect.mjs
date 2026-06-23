#!/usr/bin/env node
// detect.mjs — find raw spacing on call-sites: a non-zero px length on a
// padding/margin/gap property that is not a var(). The SCSS axis of the token
// systematization (sibling of scripts/design-primitives/detect.mjs, the TSX axis).
// API, not a human report: JSON to stdout. Walks the declaration AST via PostCSS,
// so values in comments and inside calc()/url()/var() are never misread.
//
//   node scripts/design-tokens/detect.mjs --category=spacing            # scan all src/**/*.scss
//   node scripts/design-tokens/detect.mjs --category=spacing a.scss …   # scan only these (staged/fixtures)
//
// shared/assets/style/** (the token DEFINITION files) is excluded — raw px there
// is canonical. Output: { category, count, sites:[{file,line,prop,value}] }, where
// `value` is the full declaration value (a shorthand stays one site).
import {
  SPACING_PROPS, isLegalRawZone, parseScss, valueHasRawPx, allScssFiles, rel,
} from './lib.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const category = (args.find((a) => a.startsWith('--category=')) ?? '').split('=')[1];
if (category !== 'spacing') {
  console.error("detect.mjs: --category=spacing required (this tool is the spacing axis)");
  process.exit(2);
}

const explicit = args.filter((a) => !a.startsWith('--') && a.endsWith('.scss'));
const files = explicit.length ? explicit.map((p) => resolve(p)) : allScssFiles();

const sites = [];
for (const file of files) {
  if (isLegalRawZone(file)) continue; // token definitions are the legal raw zone
  let code;
  try { code = readFileSync(file, 'utf8'); } catch { continue; } // removed mid-run
  let root;
  try { root = parseScss(code); } catch { continue; } // unparseable partial — skip, never crash
  root.walkDecls((d) => {
    if (!SPACING_PROPS.has(d.prop.toLowerCase())) return;
    if (!valueHasRawPx(d.value)) return;
    sites.push({ file: rel(file), line: d.source.start.line, prop: d.prop, value: d.value });
  });
}

process.stdout.write(JSON.stringify({ category, count: sites.length, sites }, null, 2) + '\n');

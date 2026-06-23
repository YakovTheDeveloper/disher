#!/usr/bin/env node
// manifest.mjs --category=heading|text — Stage 1 of /systematize-design-slice (TSX
// axis). Runs detect, proposes a target primitive+role per site FROM ITS className,
// and emits the review manifest the предложка consumes. The `to` field is the REAL
// codemod output (computed via lib.planJsxEdits), so preview === the transform that
// will apply — the manifest is not hand-authored. Role proposals are transparent
// className rules, honestly flagged by confidence; the предложка is where a human
// confirms or edits each. Output: scripts/design-primitives/manifest.<category>.json.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTsx, findSite, planJsxEdits, applyEdits, PRIMITIVE_DEFAULT_HOST } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const category = (process.argv.slice(2).find((a) => a.startsWith('--category=')) ?? '').split('=')[1];
if (!['heading', 'text'].includes(category)) {
  console.error('manifest.mjs: --category=heading|text required');
  process.exit(2);
}

// className key → proposed target ROLE. `<Heading>` is role-only since 2026-06-23
// (legacy `size` removed); roles = display (masthead/screen) / headline (modal &
// section headers, dish name) / title (card titles, nutrient names). The whole
// point of the предложка is to confirm these by sight; `confidence` marks how much
// of a guess each rule is. `sectionLabel` is a heading TAG carrying a label ROLE —
// bucket B (cross-primitive): the serif `sectionLabel` is now nutrients-only, so
// the default proposal is a sans `<Heading role="title">`, with `<Text role="label">`
// offered as an alternative in the предложка.
const RULES = {
  title: { primitive: 'Heading', props: { role: 'headline' }, bucket: 'A', confidence: 'high' },
  heading: { primitive: 'Heading', props: { role: 'display' }, bucket: 'A', confidence: 'medium' },
  sectionTitle: { primitive: 'Heading', props: { role: 'headline' }, bucket: 'A', confidence: 'medium' },
  sectionLabel: { primitive: 'Heading', props: { role: 'title' }, bucket: 'B', confidence: 'low' },
};
// Unknown className → a guess, flagged bucket C so the предложка surfaces it for a
// human call rather than silently converting.
const FALLBACK = { primitive: 'Heading', props: { role: 'title' }, bucket: 'C', confidence: 'low' };

const sites = JSON.parse(
  execFileSync('node', [join(HERE, 'detect.mjs'), `--category=${category}`], { encoding: 'utf8', maxBuffer: 1e8 }),
).sites;

const fileCache = new Map();
function load(abs) {
  if (!fileCache.has(abs)) {
    const code = readFileSync(abs, 'utf8');
    fileCache.set(abs, { code, ast: parseTsx(code) });
  }
  return fileCache.get(abs);
}

const entries = sites.map((s) => {
  const abs = join(HERE, '..', '..', s.file); // s.file = "src/…" relative to the app
  const { code, ast } = load(abs);
  const styleKey = (s.open.match(/className=\{[\w$]+\.(\w+)\}/) ?? [])[1] ?? null;
  const rule = (styleKey && RULES[styleKey]) || FALLBACK;

  const props = {};
  if (s.tag !== PRIMITIVE_DEFAULT_HOST[rule.primitive]) props.as = s.tag; // keep host only when ≠ default
  Object.assign(props, rule.props);

  // Real codemod preview, scoped to the opening tag (compact `from → to`).
  const el = findSite(ast, { line: s.line, tag: s.tag, column: s.column });
  const open = el.openingElement;
  const base = open.range[0];
  const openSrc = code.slice(base, open.range[1]);
  const local = planJsxEdits(el, { primitive: rule.primitive, props })
    .edits.filter((e) => e.start >= base && e.end <= open.range[1])
    .map((e) => ({ start: e.start - base, end: e.end - base, text: e.text }));
  const to = applyEdits(openSrc, local);

  const textChild = (el.children ?? []).find((c) => c.type === 'JSXText' && c.value.trim());
  const sampleText = textChild ? textChild.value.trim() : rule.primitive === 'Heading' ? 'Заголовок' : 'Подпись';

  return {
    id: createHash('sha1').update(`${s.file}:${s.line}:${s.open}`).digest('hex').slice(0, 8),
    axis: 'tsx',
    file: s.file,
    line: s.line,
    tag: s.tag,
    styleKey,
    from: s.open,
    to,
    primitive: rule.primitive,
    props,
    sampleText,
    bucket: rule.bucket,
    confidence: rule.confidence,
  };
});

const hash = createHash('sha1')
  .update(JSON.stringify(entries.map((e) => [e.id, e.from, e.to])))
  .digest('hex')
  .slice(0, 12);
const out = { category, count: entries.length, hash, entries };
writeFileSync(join(HERE, `manifest.${category}.json`), JSON.stringify(out, null, 2) + '\n');

console.log(`manifest.${category}.json — ${entries.length} entries, hash ${hash}`);
for (const e of entries) {
  console.log(`  [${e.bucket}/${e.confidence}] ${e.file.replace(/^src\//, '')}:${e.line}\n      ${e.from}\n   →  ${e.to}`);
}

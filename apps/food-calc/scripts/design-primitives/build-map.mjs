#!/usr/bin/env node
// build-map.mjs — stage-3 of the typography systematization: turn an approved
// предложка selection (manifest + the URL's ?a= approvals + ?o= role overrides)
// into the codemod map consumed by codemod.mjs / equivalence.mjs. The предложка
// never stores `as`, so this is where host-preservation for cross-primitive
// (Text) picks is injected — equivalence.mjs is the backstop if it's forgotten.
//
//   node scripts/design-primitives/build-map.mjs \
//     --manifest=scripts/design-primitives/manifest.heading.json \
//     --url='https://localhost:5173/suggestion_<id>?a=…&o=…&m=…' \
//     [--root=apps/food-calc/] > map.json
//   (or pass --approved=<ids csv> --overrides=<id:key csv> instead of --url)
//
// Mirrors review.ts `effectiveTarget` so the emitted transform === the предложка
// preview's intent:
//   • A-row (heading site): role = override ?? manifest role; primitive Heading;
//     `as` carried from the manifest (preserves a non-h2 host).
//   • B-row (section-LABEL, cross-primitive): the override key selects a B_TARGET
//     (h-title|t-label|t-serif|keep). For a Text target the source tag is a
//     heading (<h2>) but Text defaults to <p>, so `as=<tag>` is injected to keep
//     the DOM host. `keep` → the row is dropped (no conversion).
//
// Selection: ids in ?a=. If ?a= is empty BUT ?o= covers rows, every overridden
// row is taken as selected (the предложка lets you curate purely by setting a
// role; a row left wholly untouched is a skip). The choice is printed to stderr.
import { readFileSync } from 'node:fs';

// B_TARGETS mirrored from s_*/review.ts (small + stable; kept in sync by hand).
const B_TARGETS = {
  'h-title': { primitive: 'Heading', props: { role: 'title' } },
  't-label': { primitive: 'Text', props: { role: 'label' } },
  't-serif': { primitive: 'Text', props: { variant: 'sectionLabel' } },
  keep: null,
};

function arg(name, def = '') {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : def;
}

const manifestPath = arg('manifest');
if (!manifestPath) {
  console.error('build-map.mjs: --manifest=<file> required');
  process.exit(2);
}
const root = arg('root', 'apps/food-calc/');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

let approvedStr = arg('approved');
let overridesStr = arg('overrides');
const urlArg = arg('url');
if (urlArg) {
  const u = new URL(urlArg);
  approvedStr = u.searchParams.get('a') ?? '';
  overridesStr = u.searchParams.get('o') ?? '';
  const urlHash = u.searchParams.get('m') ?? '';
  if (urlHash && urlHash !== manifest.hash) {
    console.error(
      `build-map.mjs: WARNING — URL manifest hash ${urlHash} ≠ current ${manifest.hash}. The selection was made against a different audit; re-audit before applying.`,
    );
  }
}

const approved = new Set(approvedStr.split(',').map((s) => s.trim()).filter(Boolean));
const overrides = {};
for (const pair of overridesStr.split(',').map((s) => s.trim()).filter(Boolean)) {
  const [id, k] = pair.split(':');
  if (id && k) overrides[id] = k;
}

// Selection: explicit approvals, else every overridden row (curate-by-role).
const selectedIds = approved.size ? approved : new Set(Object.keys(overrides));
if (!approved.size) {
  console.error(
    `build-map.mjs: no ?a= approvals; taking the ${selectedIds.size} overridden row(s) as selected.`,
  );
}

const map = [];
const skipped = [];
for (const e of manifest.entries) {
  if (!selectedIds.has(e.id)) continue;
  const pick = overrides[e.id];

  let primitive;
  let props;
  if (e.bucket === 'B') {
    const t = B_TARGETS[pick ?? 'h-title'];
    if (!t) {
      skipped.push({ id: e.id, why: `keep/unknown B target "${pick}"` });
      continue;
    }
    primitive = t.primitive;
    props = { ...t.props };
    // Text defaults to <p>; the source tag is a heading — preserve the host.
    if (primitive === 'Text' && e.tag !== 'p') props = { as: e.tag, ...props };
  } else {
    primitive = 'Heading';
    const role = pick ?? e.props.role ?? 'title';
    // Carry `as` (non-h2 host) from the manifest, then the (maybe overridden) role.
    props = { ...e.props, role };
  }

  map.push({ id: e.id, file: root + e.file, line: e.line, tag: e.tag, primitive, props });
}

process.stderr.write(
  `build-map.mjs: ${map.length} site(s) mapped${
    skipped.length ? `, ${skipped.length} skipped (${skipped.map((s) => s.id).join(',')})` : ''
  }.\n`,
);
process.stdout.write(JSON.stringify(map, null, 2) + '\n');

// Shared AST core for the TSX typography-primitive tooling (detect / codemod /
// equivalence). The TSX axis of the typography systematization: raw text-bearing
// host tags (`<h1>`–`<h4>`, `<p>`, `<span>`) → the `<Heading>` / `<Text>`
// primitives (project_font_family_tokenized_2026_06_22 — the real goal is
// encapsulating typography in primitives, NOT scss token-swaps).
//
// Reuse-first: the codemod and the equivalence proof share ONE transform here so
// they can never drift. Stack = @typescript-eslint/parser (already a devDep) +
// byte-range splicing — NOT regex, NOT a re-generator. The codemod only renames
// the tag and inserts the primitive's props; children/attributes are never inside
// an edit range, so they survive byte-for-byte by construction. The SCSS axis
// (PostCSS) lives in scripts/design-tokens/; this is its sibling, not a fork.
import { parse } from '@typescript-eslint/parser';

/** Canonical import for both primitives (the barrel — see HypothesisListItem.tsx). */
export const PRIMITIVE_IMPORT_SOURCE = '@/shared/ui/atoms/Typography';

/** Raw host tags in scope per category. `heading` → `<Heading>`; `text` →
 *  `<Text>`. `span` lives in `text` (an inline run); a span that should become a
 *  Heading is expressed in the map as `{primitive:'Heading', props:{as:'span'}}`. */
export const CATEGORY_TAGS = {
  heading: ['h1', 'h2', 'h3', 'h4'],
  text: ['p', 'span'],
};

/** The DOM tag each primitive renders when `as` is omitted (Heading.tsx / Text.tsx
 *  defaults). The equivalence proof uses this to assert the host tag is preserved. */
export const PRIMITIVE_DEFAULT_HOST = {
  Heading: 'h2',
  Text: 'p',
};

/** Path fragments excluded from the full-src scan. The primitives THEMSELVES render
 *  raw `<Tag>` (their job, not drift); tests/stories aren't shipped UI; and the dev
 *  surfaces below are NOT app UI — `app/development-features/**` are the gitignored
 *  /предложка suggestion routes (own `--s-*` system, project_dev_tools_design_system),
 *  `pages/ui-kit` is the design-system showcase, `pages/suggestion` is the предложка
 *  host. Migrating any of them is out of scope (and would re-style dev tooling). */
const EXCLUDE_SUFFIXES = ['.test.tsx', '.stories.tsx'];
const EXCLUDE_DIR_FRAGMENTS = [
  'shared/ui/atoms/Typography/',
  'app/development-features/',
  'pages/ui-kit/',
  'pages/suggestion/',
];

/** True when a file path is out of scope for detection (a primitive / test / story
 *  / dev surface / non-tsx). Applied to BOTH the walk and explicit file args, so
 *  pointing the tool at an excluded file never flags its raw tags. */
export function isExcluded(relOrAbsPath) {
  const p = relOrAbsPath.replace(/\\/g, '/');
  if (!p.endsWith('.tsx')) return true;
  if (EXCLUDE_DIR_FRAGMENTS.some((fr) => p.includes(fr))) return true;
  return EXCLUDE_SUFFIXES.some((s) => p.endsWith(s));
}

/** Parse TSX → ESTree AST with byte ranges + source positions. */
export function parseTsx(code) {
  return parse(code, { jsx: true, range: true, loc: true });
}

/** Depth-first visit of every node carrying a `.type` (skips `parent` back-refs). */
export function walkNodes(node, cb) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walkNodes(child, cb);
    return;
  }
  if (typeof node.type === 'string') cb(node);
  for (const key in node) {
    if (key === 'parent') continue;
    walkNodes(node[key], cb);
  }
}

/** Lowercase host-tag name of a JSXElement, or null for a component (`<Heading>`)
 *  or a member/namespaced tag (`<a.b>`). Only host tags (lowercase identifiers)
 *  are migration candidates. */
export function hostTagName(el) {
  const name = el.openingElement?.name;
  if (!name || name.type !== 'JSXIdentifier') return null;
  return /^[a-z]/.test(name.name) ? name.name : null;
}

/** True when the element carries actual text: a non-blank JSXText child, or a
 *  `{expr}` container (an interpolated string/value). An element-only child
 *  (`<span><Icon/></span>`) or an empty-expression comment (`{/* … *​/}`) is NOT
 *  text — that's the icon-wrapper / placeholder false-positive guard. */
export function isTextBearing(el) {
  return (el.children ?? []).some((c) => {
    if (c.type === 'JSXText') return c.value.trim() !== '';
    if (c.type === 'JSXExpressionContainer') {
      return c.expression && c.expression.type !== 'JSXEmptyExpression';
    }
    return false;
  });
}

/** Attribute names present on the opening tag (spreads reported as the literal
 *  '...'); used for the collision check + the detect snippet. */
export function attributeNames(el) {
  return (el.openingElement?.attributes ?? []).map((a) =>
    a.type === 'JSXAttribute' && a.name?.type === 'JSXIdentifier' ? a.name.name : '...',
  );
}

/** Every text-bearing host-tag JSXElement in `code` whose tag is in `tags`.
 *  Returns the raw element nodes (callers read `.openingElement`, `.loc`, …). */
export function findCandidates(code, tags) {
  const ast = parseTsx(code);
  const hits = [];
  walkNodes(ast, (n) => {
    if (n.type !== 'JSXElement') return;
    const tag = hostTagName(n);
    if (tag && tags.includes(tag) && isTextBearing(n)) hits.push(n);
  });
  return hits;
}

/** Locate the single JSXElement at `line` whose tag === `tag` (optionally also
 *  matching 1-based `column`). Throws on zero / ambiguous matches so a stale map
 *  fails loudly instead of editing the wrong node. */
export function findSite(ast, { line, tag, column }) {
  const matches = [];
  walkNodes(ast, (n) => {
    if (n.type !== 'JSXElement') return;
    const o = n.openingElement;
    if (hostTagName(n) !== tag) return;
    if (o.loc.start.line !== line) return;
    if (column != null && o.loc.start.column + 1 !== column) return;
    matches.push(n);
  });
  if (matches.length === 0) throw new Error(`no <${tag}> at line ${line}`);
  if (matches.length > 1) {
    throw new Error(`ambiguous: ${matches.length} <${tag}> at line ${line} — add "column" to the map entry`);
  }
  return matches[0];
}

/** Serialize a props object to JSX attribute text. String → `k="v"`; `true` →
 *  bare `k`; `{ __raw: 'expr' }` → `k={expr}`; `false`/`null`/`undefined` → omitted. */
export function serializeProps(props) {
  if (!props) return '';
  return Object.entries(props)
    .map(([k, v]) => {
      if (v === false || v == null) return null;
      if (v === true) return k;
      if (typeof v === 'object' && '__raw' in v) return `${k}={${v.__raw}}`;
      return `${k}="${v}"`;
    })
    .filter(Boolean)
    .join(' ');
}

/** The byte-range edits that turn one raw host element into a primitive: rename
 *  the opening tag name, insert the primitive props right after it, rename the
 *  closing tag name. ALL edits sit inside the tag delimiters — never in the
 *  children span — so children survive byte-for-byte. Returns `{edits, childrenSpan}`. */
export function planJsxEdits(el, { primitive, props }) {
  const open = el.openingElement;
  const nameNode = open.name;
  const edits = [{ start: nameNode.range[0], end: nameNode.range[1], text: primitive }];

  const propText = serializeProps(props);
  if (propText) edits.push({ start: nameNode.range[1], end: nameNode.range[1], text: ` ${propText}` });

  if (!open.selfClosing && el.closingElement) {
    const cn = el.closingElement.name;
    edits.push({ start: cn.range[0], end: cn.range[1], text: primitive });
  }

  // Children = strictly between the opening tag's end and the closing tag's start.
  const childrenSpan = open.selfClosing
    ? null
    : [open.range[1], el.closingElement ? el.closingElement.range[0] : el.range[1]];

  return { edits, childrenSpan };
}

/** Apply byte-range edits to source in ONE pass — sorted by descending start so
 *  every edit uses original offsets (no re-scan of just-written text). */
export function applyEdits(code, edits) {
  let out = code;
  for (const e of [...edits].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return out;
}

/** All local binding names introduced by the file's import declarations. */
function importedBindings(ast) {
  const names = new Set();
  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration') continue;
    for (const spec of node.specifiers) names.add(spec.local.name);
  }
  return names;
}

/** Edit(s) that guarantee `neededPrimitives` are imported from the canonical
 *  barrel — idempotent. Merges into an existing barrel import when present,
 *  otherwise adds a fresh line after the last import (or at the top). Names are
 *  sorted for a deterministic result. */
export function ensureImportEdits(code, ast, neededPrimitives) {
  const bound = importedBindings(ast);
  const toAdd = [...new Set(neededPrimitives)].filter((n) => !bound.has(n)).sort();
  if (toAdd.length === 0) return [];

  const imports = ast.body.filter((n) => n.type === 'ImportDeclaration');
  const barrel = imports.find(
    (n) =>
      n.source.value === PRIMITIVE_IMPORT_SOURCE &&
      n.specifiers.some((s) => s.type === 'ImportSpecifier'),
  );

  if (barrel) {
    const lastSpec = barrel.specifiers[barrel.specifiers.length - 1];
    return [{ start: lastSpec.range[1], end: lastSpec.range[1], text: `, ${toAdd.join(', ')}` }];
  }

  const eol = code.includes('\r\n') ? '\r\n' : '\n'; // stay newline-faithful (CRLF app files)
  const line = `import { ${toAdd.join(', ')} } from '${PRIMITIVE_IMPORT_SOURCE}';`;
  if (imports.length > 0) {
    const last = imports[imports.length - 1];
    return [{ start: last.range[1], end: last.range[1], text: `${eol}${line}` }];
  }
  return [{ start: 0, end: 0, text: `${line}${eol}` }];
}

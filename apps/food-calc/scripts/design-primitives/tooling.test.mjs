// Contract tests for the TSX typography-primitive tooling (detect / codemod /
// equivalence). Like guards.test.mjs, each tool is exercised as the real CLI it
// is — spawn `node <tool>` against fixtures and assert the JSON / exit code. The
// fixtures ARE the contract: bad→hits, good→0, primitive-path→excluded, and the
// codemod is byte-exact input→expected.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = join(HERE, '__fixtures__');
const norm = (s) => s.replace(/\r\n/g, '\n'); // ignore platform EOL in byte-compare

// Run a tool; return { code, json }. detect always exits 0; equivalence exits 1
// when not ok — in both cases the JSON is on stdout.
function run(tool, args) {
  try {
    const out = execFileSync('node', [join(HERE, tool), ...args], { encoding: 'utf8' });
    return { code: 0, json: JSON.parse(out) };
  } catch (e) {
    const out = (e.stdout ?? '').toString();
    return { code: e.status ?? 1, json: out ? JSON.parse(out) : null };
  }
}

const detect = (category, file) => run('detect.mjs', [`--category=${category}`, file]).json;

describe('detect.mjs — finds raw text tags, ignores primitives & non-text', () => {
  it('heading: known-bad → the 3 raw headings (h1/h2/h3)', () => {
    const r = detect('heading', join(FIX, 'heading', 'known-bad.tsx'));
    expect(r.count).toBe(3);
    expect(r.sites.map((s) => s.tag).sort()).toEqual(['h1', 'h2', 'h3']);
  });

  it('heading: known-good (via <Heading>) → 0', () => {
    expect(detect('heading', join(FIX, 'heading', 'known-good.tsx')).count).toBe(0);
  });

  it('text: known-bad → the 3 raw text tags (p, span, p)', () => {
    const r = detect('text', join(FIX, 'text', 'known-bad.tsx'));
    expect(r.count).toBe(3);
    expect(r.sites.map((s) => s.tag).sort()).toEqual(['p', 'p', 'span']);
  });

  it('text: known-good → 0 (icon-wrapper span + comment span are not text)', () => {
    expect(detect('text', join(FIX, 'text', 'known-good.tsx')).count).toBe(0);
  });

  it('does NOT cross categories: a heading scan ignores <p>/<span>', () => {
    expect(detect('heading', join(FIX, 'text', 'known-bad.tsx')).count).toBe(0);
  });

  it('excludes the Typography primitives by path (raw <Tag> there is legal)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dp-'));
    const file = join(dir, 'shared', 'ui', 'atoms', 'Typography', 'Heading', 'Heading.tsx');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, 'const X = () => <h2 className="a">raw</h2>;\nexport default X;\n');
    try {
      expect(detect('heading', file).count).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// Materialize the codemod fixture in a temp dir, point the map at it, run the
// codemod, and compare the rewritten file to expected.tsx byte-for-byte.
function stageCodemod() {
  const dir = mkdtempSync(join(tmpdir(), 'dp-'));
  const input = join(dir, 'input.tsx');
  const mapFile = join(dir, 'map.json');
  copyFileSync(join(FIX, 'codemod', 'input.tsx'), input);
  const entries = JSON.parse(readFileSync(join(FIX, 'codemod', 'map.json'), 'utf8')).map((e) => ({
    ...e,
    file: input,
  }));
  writeFileSync(mapFile, JSON.stringify(entries));
  return { dir, input, mapFile };
}

describe('codemod.mjs — byte-exact map application', () => {
  it('input.tsx + map.json → expected.tsx (tags swapped, props inserted, import added)', () => {
    const { dir, input, mapFile } = stageCodemod();
    try {
      run('codemod.mjs', [`--map=${mapFile}`]);
      const got = norm(readFileSync(input, 'utf8'));
      const want = norm(readFileSync(join(FIX, 'codemod', 'expected.tsx'), 'utf8'));
      expect(got).toBe(want);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('equivalence.mjs — pre-flight loss-free proof', () => {
  it('the codemod map is loss-free → ok, exit 0', () => {
    const { dir, mapFile } = stageCodemod();
    try {
      const { code, json } = run('equivalence.mjs', [`--map=${mapFile}`]);
      expect(json.ok).toBe(true);
      expect(code).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('FAILS when the host tag would change (h3 → default-h2 Heading, no as)', () => {
    const { dir, input, mapFile } = stageCodemod();
    try {
      writeFileSync(
        mapFile,
        JSON.stringify([{ file: input, line: 8, tag: 'h3', primitive: 'Heading', props: { size: 'card' } }]),
      );
      const { code, json } = run('equivalence.mjs', [`--map=${mapFile}`]);
      expect(json.ok).toBe(false);
      expect(code).toBe(1);
      expect(json.mismatches[0].why).toMatch(/host tag/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('FAILS when a prop collides with an existing attribute (className)', () => {
    const { dir, input, mapFile } = stageCodemod();
    try {
      writeFileSync(
        mapFile,
        JSON.stringify([
          { file: input, line: 8, tag: 'h3', primitive: 'Heading', props: { as: 'h3', className: { __raw: 'x' } } },
        ]),
      );
      const { json } = run('equivalence.mjs', [`--map=${mapFile}`]);
      expect(json.ok).toBe(false);
      expect(json.mismatches.some((m) => /collides/.test(m.why))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

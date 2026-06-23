// Contract tests for the SCSS spacing-token tooling (detect / codemod /
// equivalence). Like guards.test.mjs and the design-primitives sibling, each tool
// is exercised as the real CLI it is — spawn `node <tool>` against fixtures and
// assert the JSON / exit code. The fixtures ARE the contract: bad→hits, good→0,
// definitions→0, the codemod is byte-exact, equivalence proves value identity.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = join(HERE, '__fixtures__', 'spacing');
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
const detect = (file) => run('detect.mjs', ['--category=spacing', file]).json;

describe('detect.mjs — finds raw spacing, ignores tokens, zero, non-spacing props', () => {
  it('known-bad → the 3 raw spacing sites (padding/margin/gap)', () => {
    const r = detect(join(FIX, 'known-bad.scss'));
    expect(r.count).toBe(3);
    expect(r.sites.map((s) => s.prop).sort()).toEqual(['gap', 'margin', 'padding']);
    expect(r.sites.find((s) => s.prop === 'margin').value).toBe('24px 8px');
  });

  it('known-good (via var(--space-*)) → 0', () => {
    expect(detect(join(FIX, 'known-good.scss')).count).toBe(0);
  });

  it('token-def (custom-property definitions) → 0 (definitions are not call-sites)', () => {
    expect(detect(join(FIX, 'token-def.scss')).count).toBe(0);
  });

  it('excludes shared/assets/style/** by path (raw px there is canonical)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dt-'));
    const file = join(dir, 'src', 'shared', 'assets', 'style', 'tokens.scss');
    mkdirSync(dirname(file), { recursive: true });
    // NOTE: the by-path exclusion keys off the tool's own SRC dir, so a temp file
    // can't exercise it. Instead assert the canonical real file is never flagged.
    rmSync(dir, { recursive: true, force: true });
    const real = join(HERE, '..', '..', 'src', 'shared', 'assets', 'style', 'tokens.scss');
    expect(detect(real).count).toBe(0);
  });
});

// Materialize the codemod fixture in a temp dir, point the map at it, run the
// codemod, and compare the rewritten file to expected.scss byte-for-byte.
function stageCodemod() {
  const dir = mkdtempSync(join(tmpdir(), 'dt-'));
  const input = join(dir, 'input.scss');
  const mapFile = join(dir, 'map.json');
  copyFileSync(join(FIX, 'input.scss'), input);
  const entries = JSON.parse(readFileSync(join(FIX, 'map.json'), 'utf8')).map((e) => ({ ...e, file: input }));
  writeFileSync(mapFile, JSON.stringify(entries));
  return { dir, input, mapFile };
}

describe('codemod.mjs — byte-exact splice (preserves // comments & formatting)', () => {
  it('input.scss + map.json → expected.scss (values swapped, every other byte intact)', () => {
    const { dir, input, mapFile } = stageCodemod();
    try {
      run('codemod.mjs', [`--map=${mapFile}`]);
      const got = norm(readFileSync(input, 'utf8'));
      const want = norm(readFileSync(join(FIX, 'expected.scss'), 'utf8'));
      expect(got).toBe(want);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('THROWS on a stale map (asserted value no longer at that line/prop)', () => {
    const { dir, input, mapFile } = stageCodemod();
    try {
      writeFileSync(mapFile, JSON.stringify([{ file: input, line: 2, prop: 'padding', value: '99px', token: 'var(--space-4)' }]));
      expect(() => execFileSync('node', [join(HERE, 'codemod.mjs'), `--map=${mapFile}`], { encoding: 'utf8' })).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('equivalence.mjs — static value-identity proof', () => {
  it('the codemod map is value-exact → ok, exit 0', () => {
    const { dir, mapFile } = stageCodemod();
    try {
      const { code, json } = run('equivalence.mjs', [`--map=${mapFile}`]);
      expect(json.ok).toBe(true);
      expect(code).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('FAILS when the token resolves to a different value (16px → --space-2 = 8px)', () => {
    const { dir, input, mapFile } = stageCodemod();
    try {
      writeFileSync(mapFile, JSON.stringify([{ file: input, line: 2, prop: 'padding', value: '16px', token: 'var(--space-2)' }]));
      const { code, json } = run('equivalence.mjs', [`--map=${mapFile}`]);
      expect(json.ok).toBe(false);
      expect(code).toBe(1);
      expect(json.mismatches[0].resolved).toBe('8px');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('FAILS loud on an unknown token', () => {
    const { dir, input, mapFile } = stageCodemod();
    try {
      writeFileSync(mapFile, JSON.stringify([{ file: input, line: 2, prop: 'padding', value: '16px', token: 'var(--space-999)' }]));
      const { json } = run('equivalence.mjs', [`--map=${mapFile}`]);
      expect(json.ok).toBe(false);
      expect(json.mismatches[0].why).toMatch(/unknown token/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

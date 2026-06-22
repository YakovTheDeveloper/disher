// Unit tests for the SCSS token guards (check-selected-token.mjs +
// check-scale-tokens.mjs). They run as CLI scripts that exit non-zero on a
// violation, so we test the real contract: feed a temp .scss fixture as the
// file arg and assert the exit code. `known` tokens are still built from the
// real src walk, so a ref to an undefined token in the fixture is a violation.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

// Run a guard against a one-off fixture; return its exit code (0 = clean).
function runGuard(script, content) {
  const dir = mkdtempSync(join(tmpdir(), 'guard-'));
  const file = join(dir, 'fixture.scss');
  writeFileSync(file, content, 'utf8');
  try {
    execFileSync('node', [join('scripts', script), file], { stdio: 'pipe' });
    return 0;
  } catch (e) {
    return e.status ?? 1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Same, but materializes the fixture at a real nested sub-path so the text-role
// guard's allow-list (`relative(APP, file).endsWith(suffix)`) can be exercised.
function runGuardNamed(script, relName, content) {
  const dir = mkdtempSync(join(tmpdir(), 'guard-'));
  const file = join(dir, relName);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
  try {
    execFileSync('node', [join('scripts', script), file], { stdio: 'pipe' });
    return 0;
  } catch (e) {
    return e.status ?? 1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('check-selected-token.mjs — collapsed --chip-active-* channel', () => {
  it('FAILS on a --chip-active-* declaration', () => {
    expect(runGuard('check-selected-token.mjs', '.x { --chip-active-bg: red; }')).toBe(1);
  });

  it('FAILS on a var(--chip-active-*) read', () => {
    expect(runGuard('check-selected-token.mjs', '.x { background: var(--chip-active-bg); }')).toBe(1);
  });

  it('PASSES when the channel only appears inside a comment (stripped)', () => {
    expect(runGuard('check-selected-token.mjs', '// legacy --chip-active-bg: red was here\n.x { color: red; }')).toBe(0);
  });

  it('PASSES on clean selected paint via the sys token', () => {
    expect(runGuard('check-selected-token.mjs', '.x { background: var(--sys-color-bg-selected); }')).toBe(0);
  });
});

describe('check-scale-tokens.mjs — unknown-token guard', () => {
  it('FAILS on a var() ref to an undefined guarded-family token', () => {
    expect(runGuard('check-scale-tokens.mjs', '.x { color: var(--ref-color-zzz-999); }')).toBe(1);
  });

  it('PASSES when the bad ref only appears inside a comment (stripped)', () => {
    expect(runGuard('check-scale-tokens.mjs', '// was var(--ref-color-zzz-999)\n.x { color: red; }')).toBe(0);
  });

  it('PASSES on a ref to a real token', () => {
    expect(runGuard('check-scale-tokens.mjs', '.x { background: var(--sys-color-bg-selected); }')).toBe(0);
  });

  it('PASSES on an interpolated ref (SCSS mixin) — var(--sys-text-#{$role}-size)', () => {
    expect(runGuard('check-scale-tokens.mjs', '.x { font-size: var(--sys-text-#{$role}-size); }')).toBe(0);
  });
});

describe('check-text-role.mjs — text-role() stays in the Typography primitives', () => {
  it('FAILS on @include text-role() in an out-of-bounds component module', () => {
    expect(
      runGuardNamed('check-text-role.mjs', 'features/foo/Foo.module.scss', '.x { @include text-role("title"); }'),
    ).toBe(1);
  });

  it('PASSES on @include text-role() inside the Heading primitive', () => {
    expect(
      runGuardNamed(
        'check-text-role.mjs',
        'shared/ui/atoms/Typography/Heading/Heading.module.scss',
        '.title { @include text-role("title"); }',
      ),
    ).toBe(0);
  });

  it('PASSES on @include text-role() inside the Text primitive', () => {
    expect(
      runGuardNamed(
        'check-text-role.mjs',
        'shared/ui/atoms/Typography/Text/Text.module.scss',
        '.body { @include text-role("body"); }',
      ),
    ).toBe(0);
  });

  it('PASSES when text-role only appears in a comment (stripped)', () => {
    expect(
      runGuardNamed('check-text-role.mjs', 'features/foo/Foo.module.scss', '// use @include text-role("title") here\n.x { color: red; }'),
    ).toBe(0);
  });
});

// Regression guard for the design-token stylelint gate (.stylelintrc.cjs).
// Locks the 2026-06-24 sys-only contract (supersedes the 2026-06-01 "any variable
// passes" gate): a gated property accepts ONLY a matching `var(--sys-…)` token of
// its family (+ structural keywords). Raw literals, a bare non-sys `var()`,
// `--ref-*`/legacy vars, and raw SCSS `$vars` are ALL rejected. If someone flips
// `ignoreVariables`/`ignoreFunctions` back to true, drops the rule, or loosens the
// whitelist, this test fails — the gate can't silently rot. See
// tds/ANALYSIS/property-token-contract-2026-06-24.md + design-consistency-plan.
import { describe, it, expect } from 'vitest';
import stylelint from 'stylelint';

const RULE = 'scale-unlimited/declaration-strict-value';

// Lint a snippet as if it were a fresh module (NOT baselined, NOT a primitive file),
// so the strict-value rule is active.
async function lint(code: string) {
  const { results } = await stylelint.lint({
    code,
    codeFilename: 'src/__gate_probe__.module.scss',
    configFile: '.stylelintrc.cjs',
  });
  return results[0].warnings.filter((w) => w.rule === RULE);
}

describe('stylelint token gate', () => {
  it('rejects a raw hex color', async () => {
    expect(await lint('.x { color: #ff0000; }')).toHaveLength(1);
  });

  it('rejects raw rgba() — ignoreFunctions must stay false', async () => {
    expect(await lint('.x { color: rgba(0, 0, 0, 0.5); }')).toHaveLength(1);
  });

  it('rejects raw px font-size and border-radius', async () => {
    const warnings = await lint('.x { font-size: 14px; border-radius: 8px; }');
    expect(warnings.length).toBeGreaterThanOrEqual(2);
  });

  it('accepts a matching --sys-* token per property', async () => {
    const warnings = await lint(
      '.x { color: var(--sys-color-ink); font-size: var(--sys-text-size-base); border-radius: var(--sys-radius-sm); }',
    );
    expect(warnings).toHaveLength(0);
  });

  it('rejects a bare non-sys var() — ignoreVariables:false makes the whitelist the law', async () => {
    // A plain var() (or a --ref-*/legacy family var) no longer auto-passes.
    expect(await lint('.x { color: var(--c); }')).toHaveLength(1);
  });

  it('rejects a raw SCSS $variable (not a --sys-* token)', async () => {
    expect(await lint('.x { color: $sky-ink; }')).toHaveLength(1);
  });
});

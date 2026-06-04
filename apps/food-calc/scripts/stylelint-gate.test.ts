// Regression guard for the design-token stylelint gate (.stylelintrc.cjs).
// Locks the contract: raw color / font-size / border-radius are rejected, and a
// variable (CSS custom property or SCSS $var) passes. If someone flips
// `ignoreFunctions` back to true, drops the rule, or breaks the config, this test
// fails — the gate can't silently rot. See design-consistency-plan Phase 1.
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

  it('accepts CSS custom properties', async () => {
    const warnings = await lint(
      '.x { color: var(--c); font-size: var(--text-base); border-radius: var(--radius-sm); }',
    );
    expect(warnings).toHaveLength(0);
  });

  it('accepts a SCSS $variable', async () => {
    expect(await lint('.x { color: $sky-ink; }')).toHaveLength(0);
  });
});

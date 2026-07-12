// @vitest-environment jsdom
// Migrated from the dissolved widgets/.../NutrientTable.test.tsx. Guards the
// nutrient view compositions (NutrientGroupedList + rows + useNutrientReadout):
//   • group titles render in the meter view, «Моя норма», and the editor;
//   • «% нормы» is gated by an OFFICIAL daily norm — protein (id 1) and sugar
//     (id 4, promoted to a full nutrient 2026-07-11) have one, β-carotene
//     (id 34) doesn't (its defaultDailyNorms entry is a placeholder), so its
//     «% / цель» stays hidden even with a user norm;
//   • with no user norm at all the meter falls back to «value + unit», no bar;
//   • «Моя норма» renders «—» instead of a fabricated placeholder norm;
//   • the editor commits a row edit on blur through onValueChange(id, value).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// The norm-glue hook reads the user norm through the daily-norm @x public API.
// A mutable holder lets a single test flip to "no norm" (null) without a second
// mock. protein (id '1') gets a distinctive norm so the value assertion is
// unambiguous; sugar (id '4') is present because the setup wizard always writes
// it (generate-norm) — the case that exposed the meter/«Моя норма» divergence.
const holder = vi.hoisted(() => ({
  value: { '1': 778, '4': 50 } as Record<string, number> | null,
}));
vi.mock('@/entities/daily-norm/@x/nutrient', () => ({
  useUserNormItems: () => holder.value,
}));

const { NutrientMeterView } = await import('../NutrientMeterView');
const { NutrientNormView } = await import('../NutrientNormView');
const { NutrientEditView } = await import('../NutrientEditView');

const DEFAULT_NORM = { '1': 778, '4': 50 };
const ZERO = () => 0;
const VAL = () => 10;

afterEach(() => {
  holder.value = { ...DEFAULT_NORM };
});

describe('NutrientMeterView — group titles + % gating', () => {
  it('renders quiet group titles', () => {
    const { getByText } = render(<NutrientMeterView getValue={ZERO} />);
    expect(getByText('БЖУ')).toBeInTheDocument();
    expect(getByText('Минералы')).toBeInTheDocument();
    expect(getByText('Витамины')).toBeInTheDocument();
  });

  it('shows «%» for real-norm nutrients (protein, sugar) but not a placeholder one (β-carotene)', () => {
    const { container } = render(<NutrientMeterView getValue={VAL} />);
    const proteinRow = container.querySelector('[data-nutrient="protein"]');
    const sugarRow = container.querySelector('[data-nutrient="sugar"]');
    const betaRow = container.querySelector('[data-nutrient="betaCarotene"]');
    expect(proteinRow?.textContent).toContain('%');
    // sugar promoted to a full nutrient — with a user norm it now shows % too,
    // consistent with «Моя норма» (both surfaces agree it has a target).
    expect(sugarRow?.textContent).toContain('%');
    expect(betaRow?.textContent ?? '').not.toContain('%');
  });

  it('gates % and the fabricated target for a placeholder group nutrient (β-carotene), keeps them for a real one (calcium)', () => {
    const { container } = render(<NutrientMeterView getValue={VAL} />);
    const betaRow = container.querySelector('[data-nutrient="betaCarotene"]');
    const calciumRow = container.querySelector('[data-nutrient="calcium"]');
    // β-carotene: no official norm → no % and no «3000»-target column.
    expect(betaRow?.textContent ?? '').not.toContain('%');
    expect(betaRow?.textContent ?? '').not.toContain('3000');
    // calcium: real norm (default 1000) → % shows.
    expect(calciumRow?.textContent).toContain('%');
  });

  it('still renders the value + unit for a placeholder nutrient (β-carotene) when % is hidden', () => {
    const { container } = render(<NutrientMeterView getValue={VAL} />);
    const betaRow = container.querySelector('[data-nutrient="betaCarotene"]');
    expect(betaRow?.textContent).toContain('10');
    expect(betaRow?.textContent).toContain('мкг');
  });

  it('falls back to value + unit (no %/bar) when the user has no norm at all', () => {
    holder.value = null; // IDB resolved, user hasn't run setup → no gate
    const { container } = render(<NutrientMeterView getValue={VAL} />);
    const proteinRow = container.querySelector('[data-nutrient="protein"]');
    expect(proteinRow?.textContent).toContain('10');
    expect(proteinRow?.textContent).toContain('г');
    expect(proteinRow?.textContent ?? '').not.toContain('%');
  });
});

describe('NutrientNormView — «Моя норма» (view-norms)', () => {
  it('renders group titles alongside nutrient names', () => {
    const { getByText } = render(<NutrientNormView />);
    expect(getByText('Белки')).toBeInTheDocument();
    expect(getByText('БЖУ')).toBeInTheDocument();
    expect(getByText('Минералы')).toBeInTheDocument();
  });

  it('renders the norm value alongside the name', () => {
    const { getByText } = render(<NutrientNormView />);
    // protein (id '1') norm = 778 from the mocked user items.
    expect(getByText('778')).toBeInTheDocument();
  });

  it('renders the sugar norm (50) — promoted to a full nutrient, not «—»', () => {
    const { getByText } = render(<NutrientNormView />);
    const sugarRow = getByText('Сахар').closest('div');
    expect(sugarRow?.textContent).toContain('50');
    expect(sugarRow?.textContent ?? '').not.toContain('—');
  });

  it('shows «—» instead of a made-up «3000 мкг» norm for β-carotene', () => {
    const { getByText } = render(<NutrientNormView />);
    const betaRow = getByText('β-каротин').closest('div');
    expect(betaRow?.textContent ?? '').not.toContain('3000');
    expect(betaRow?.textContent ?? '').toContain('—');
  });
});

describe('NutrientEditView — editor composition', () => {
  it('renders group titles over the editable rows', () => {
    const { getByText } = render(
      <NutrientEditView getValue={ZERO} onValueChange={vi.fn()} />,
    );
    expect(getByText('БЖУ')).toBeInTheDocument();
    expect(getByText('Минералы')).toBeInTheDocument();
  });

  it('commits a row edit on blur as onValueChange(id, value)', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <NutrientEditView getValue={() => 10} onValueChange={onValueChange} />,
    );
    const input = container.querySelector(
      '[data-nutrient="protein"] input',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    fireEvent.change(input, { target: { value: '25' } });
    expect(onValueChange).not.toHaveBeenCalled(); // blur-draft: no per-keystroke commit

    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith('1', 25);
  });
});

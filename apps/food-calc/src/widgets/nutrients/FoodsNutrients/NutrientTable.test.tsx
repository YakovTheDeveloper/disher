// @vitest-environment jsdom
// NutrientTable — 2-column layout everywhere + view-norms inline «name · value».
// Guards the explicit 2026-06-08 design decisions (see project_nutrient_twocol):
//   • group titles («Минералы»/«Витамины») are NOT rendered in any variant;
//   • a view-norms row carries the nutrient name AND its norm value together.
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@/entities/daily-norm', () => ({
  // protein has id '1' (constants.ts) — give it a distinctive norm so the value
  // assertion can't collide with another nutrient's default norm.
  useUserNormItems: () => ({ '1': 778 }),
}));
vi.mock('@/shared/lib/useDesignVariant', () => ({
  useDesignVariant: () => ({ variant: 'vivid', anchor: {} }),
}));

const { default: NutrientTable } = await import('./NutrientTable');

const ZERO = () => 0;

describe('NutrientTable — 2-col, no group titles', () => {
  it('omits group titles in view-norms but still renders nutrient names', () => {
    const { queryByText, getByText } = render(
      <NutrientTable getValue={ZERO} variant="view-norms" />,
    );
    expect(getByText('Белки')).toBeInTheDocument();
    expect(queryByText('Минералы')).toBeNull();
    expect(queryByText('Витамины')).toBeNull();
  });

  it('omits group titles in the default view too (2-col everywhere)', () => {
    const { queryByText } = render(<NutrientTable getValue={ZERO} />);
    expect(queryByText('Минералы')).toBeNull();
    expect(queryByText('Витамины')).toBeNull();
  });

  it('renders the norm value alongside the name in view-norms', () => {
    const { getByText } = render(
      <NutrientTable getValue={ZERO} variant="view-norms" />,
    );
    // protein (id '1') norm = 778 from the mocked user items.
    expect(getByText('778')).toBeInTheDocument();
  });
});

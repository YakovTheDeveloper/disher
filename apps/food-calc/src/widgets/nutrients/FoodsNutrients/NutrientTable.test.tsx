// @vitest-environment jsdom
// NutrientTable layout guards:
//   • view-norms (экран «Моя норма», 2026-06-14) — плоский сгруппированный
//     список как в пикере нутриентов: группы С заголовками (БЖУ / Минералы / …);
//   • the DEFAULT view stays title-less (2026-06-08, project_nutrient_twocol);
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

describe('NutrientTable — view-norms grouped, default title-less', () => {
  it('renders group titles in view-norms alongside nutrient names', () => {
    const { getByText } = render(
      <NutrientTable getValue={ZERO} variant="view-norms" />,
    );
    expect(getByText('Белки')).toBeInTheDocument();
    expect(getByText('БЖУ')).toBeInTheDocument();
    expect(getByText('Минералы')).toBeInTheDocument();
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

// @vitest-environment jsdom
// NutrientTable layout guards:
//   • view-norms (экран «Моя норма», 2026-06-14) — плоский сгруппированный
//     список как в пикере нутриентов: группы С заголовками (БЖУ / Минералы / …);
//   • the DEFAULT view ALSO carries quiet group titles now (2026-06-27 — заголовки
//     добавлены во все места с группами нутриентов; сменило прежний title-less
//     2-col, project_nutrient_twocol);
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

describe('NutrientTable — group titles in both view-norms and default view', () => {
  it('renders group titles in view-norms alongside nutrient names', () => {
    const { getByText } = render(
      <NutrientTable getValue={ZERO} variant="view-norms" />,
    );
    expect(getByText('Белки')).toBeInTheDocument();
    expect(getByText('БЖУ')).toBeInTheDocument();
    expect(getByText('Минералы')).toBeInTheDocument();
  });

  it('renders quiet group titles in the default view too', () => {
    const { getByText } = render(<NutrientTable getValue={ZERO} />);
    expect(getByText('БЖУ')).toBeInTheDocument();
    expect(getByText('Минералы')).toBeInTheDocument();
    expect(getByText('Витамины')).toBeInTheDocument();
  });

  it('renders the norm value alongside the name in view-norms', () => {
    const { getByText } = render(
      <NutrientTable getValue={ZERO} variant="view-norms" />,
    );
    // protein (id '1') norm = 778 from the mocked user items.
    expect(getByText('778')).toBeInTheDocument();
  });
});

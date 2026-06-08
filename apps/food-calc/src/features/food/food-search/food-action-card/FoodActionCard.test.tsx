import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FoodActionCard, { formatNormPercent } from './FoodActionCard';

describe('formatNormPercent', () => {
  it('uses 2 decimals below 1%', () => {
    expect(formatNormPercent(0.05)).toBe('0.05%');
    expect(formatNormPercent(0.5)).toBe('0.50%');
  });

  it('uses 1 decimal below 10%', () => {
    expect(formatNormPercent(9)).toBe('9.0%');
    expect(formatNormPercent(9.94)).toBe('9.9%');
  });

  it('rounds to integer from 10% up', () => {
    expect(formatNormPercent(50)).toBe('50%');
    expect(formatNormPercent(1500)).toBe('1500%');
  });
});

describe('FoodActionCard — daily-norm percent', () => {
  const item = {
    id: 'p1',
    name: 'Печень',
    // 9 mg of nutrient '9' (iron) per 100g
    getTotalNutrients: () => ({ '9': 9 }),
  };

  // FoodActionCard uses data-router hooks (useViewTransitionState) for the
  // card→page morph, so it needs a real data router context, not just <Router>.
  const renderCard = (richNutrientNorm: number | undefined) => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <ul>
            <FoodActionCard
              variant="product"
              item={item}
              richNutrientId="9"
              richNutrientUnit="мг"
              richNutrientMax={20}
              richNutrientNorm={richNutrientNorm}
            />
          </ul>
        ),
      },
    ]);
    return render(<RouterProvider router={router} />);
  };

  it('renders % of daily norm when a norm is provided (9 / 18 = 50%)', () => {
    const { container } = renderCard(18);
    expect(container.textContent).toContain('50%');
    expect(container.textContent).toContain('9.0');
  });

  it('renders the raw value but no % when the nutrient has no norm', () => {
    const { container } = renderCard(undefined);
    expect(container.textContent).toContain('9.0');
    expect(container.textContent).toContain('мг');
    expect(container.textContent).not.toContain('%');
  });
});

describe('FoodActionCard — richness visuals', () => {
  // Guards the regression fixed 2026-06-08: the richness gauge used to be a
  // single opaque bar drawn over the name; it's now a soft fill BEHIND the text
  // (.richFill) + a thin left accent (.richBar). Assert both render when the
  // nutrient is present and neither when its value is zero — there's no z-index
  // unit-test, but the presence/absence contract catches an accidental removal.
  const renderCard = (nutrientValue: number) => {
    const item = {
      id: 'p1',
      name: 'Печень',
      getTotalNutrients: () => ({ '9': nutrientValue }),
    };
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <ul>
            <FoodActionCard
              variant="product"
              item={item}
              richNutrientId="9"
              richNutrientUnit="мг"
              richNutrientMax={20}
            />
          </ul>
        ),
      },
    ]);
    return render(<RouterProvider router={router} />);
  };

  it('renders both the fill gauge and the accent stripe when the nutrient is present', () => {
    const { container } = renderCard(9);
    expect(container.querySelector('[class*="richFill"]')).not.toBeNull();
    expect(container.querySelector('[class*="richBar"]')).not.toBeNull();
  });

  it('renders neither the fill nor the accent when the nutrient value is zero', () => {
    const { container } = renderCard(0);
    expect(container.querySelector('[class*="richFill"]')).toBeNull();
    expect(container.querySelector('[class*="richBar"]')).toBeNull();
  });
});

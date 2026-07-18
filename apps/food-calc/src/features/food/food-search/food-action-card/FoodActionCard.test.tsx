import { render, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FoodActionCard from './FoodActionCard';
import { drawerStore } from '@/shared/ui/drawer-store';

// Число процента и знак «%» — раздельные спаны (Numeral + NumeralMarker), но
// textContent их склеивает, поэтому assert на «50%» / «9мг» остаётся валиден. Формат
// (обрезка хвоста нулей) покрыт formatNumber.test.ts — здесь не дублируем.
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

  // «9мг», not «9.0мг» — the trailing zero is trimmed (formatNumber.ts). Asserting
  // value+unit together rather than a bare '9', which any stray digit would satisfy.
  it('renders % of daily norm when a norm is provided (9 / 18 = 50%)', () => {
    const { container } = renderCard(18);
    expect(container.textContent).toContain('50%');
    expect(container.textContent).toContain('9мг');
  });

  it('renders the raw value but no % when the nutrient has no norm', () => {
    const { container } = renderCard(undefined);
    expect(container.textContent).toContain('9мг');
    expect(container.textContent).not.toContain('%');
  });
});

describe('FoodActionCard — richness visuals', () => {
  // Richness viz = a right-hand number column + a row-wide ghost fill (.richFill,
  // scaleX = ratio). Assert the fill renders when the nutrient is present and is
  // absent when its value is zero.
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

  it('renders the richness fill when the nutrient is present', () => {
    const { container } = renderCard(9);
    expect(container.querySelector('[class*="richFill"]')).not.toBeNull();
  });

  it('renders no fill when the nutrient value is zero', () => {
    const { container } = renderCard(0);
    expect(container.querySelector('[class*="richFill"]')).toBeNull();
  });
});

describe('FoodActionCard — dish ⓘ opens DishDrawer with a name', () => {
  // The dish info button opens the side DishDrawer directly (not via navigate).
  // Unlike the long-press path (buildInfoActions → { dishId } only), the ⓘ path
  // forwards item.name as dishName so the drawer header shows the name instantly
  // while the dish loads from Dexie. Assert that props payload.
  it('forwards { dishId, dishName } to drawerStore.show', () => {
    const show = vi
      .spyOn(drawerStore, 'show')
      .mockReturnValue(Promise.resolve(undefined) as ReturnType<typeof drawerStore.show>);

    const item = { id: 'd1', name: 'борщ' };
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <ul>
            <FoodActionCard variant="dish" item={item} onInfoClick={() => {}} />
          </ul>
        ),
      },
    ]);
    const { getByLabelText } = render(<RouterProvider router={router} />);

    fireEvent.click(getByLabelText('Информация о блюде'));

    expect(show).toHaveBeenCalledWith(
      expect.anything(),
      { dishId: 'd1', dishName: 'борщ' },
      expect.objectContaining({ side: 'left' }),
    );
    show.mockRestore();
  });
});

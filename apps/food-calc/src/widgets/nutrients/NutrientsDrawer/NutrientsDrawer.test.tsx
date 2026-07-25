// NutrientsDrawer — read-only обёртка над NutrientShowcaseDrawer (слияние
// 2026-07-25): маппит totals/тексты шапки в пропы каркаса, сам ничего не
// рисует. Каркас застаблен; проверяем маппинг title/subtitle и гейт пустоты.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

let captured: Record<string, unknown> = {};
vi.mock('@/features/food/quick-view-drawer', () => ({
  NutrientShowcaseDrawer: (props: Record<string, unknown>) => {
    captured = props;
    return <div data-testid="showcase">{String(props.title)}</div>;
  },
}));

vi.mock('@/shared/ui/error/FeatureErrorBoundary', () => ({
  FeatureErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const { NutrientsDrawer } = await import('./NutrientsDrawer');

const noop = () => {};

describe('NutrientsDrawer', () => {
  it('проксирует totals в каркас с дефолтной шапкой «Нутриенты / За весь день»', () => {
    render(<NutrientsDrawer onClose={noop} totals={{ '7': 100 }} />);

    expect(captured.title).toBe('Нутриенты');
    expect(captured.subtitle).toBe('За весь день');
    expect(captured.nutrients).toEqual({ '7': 100 });
    expect(captured.hasNutrients).toBe(true);
    expect(screen.getByTestId('showcase')).toBeInTheDocument();
  });

  it('viewTitle заменяет «Нутриенты», subtitle — контекст базиса', () => {
    render(
      <NutrientsDrawer onClose={noop} totals={{}} viewTitle="борщ" subtitle="За блюдо" />,
    );

    expect(captured.title).toBe('борщ');
    expect(captured.subtitle).toBe('За блюдо');
    expect(captured.hasNutrients).toBe(false);
  });
});

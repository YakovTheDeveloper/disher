// NutrientsBar — тихая сводка нутриентов дня/блюда (используется и на HomePage,
// и на DishPage). Тест проверяет контракт: 6 ячеек (Б Ж У Кл Ккал Вода) с
// округлёнными значениями, «—» для отсутствующего нутриента, и весь блок —
// одна кнопка, открывающая разбор (onOpen).
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('./NutrientsBar.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => String(p) }),
}));

const { NutrientsBar } = await import('./NutrientsBar');

// Ключи = nutrient id (1 белок, 2 жир, 3 углевод, 6 клетчатка, 7 ккал, 8 вода).
const totals = { '1': 12.4, '2': 8.6, '3': 30.2, '6': 4.1, '7': 240.7, '8': 1000 };

describe('NutrientsBar', () => {
  it('renders all six macro cells with rounded values', () => {
    render(<NutrientsBar totals={totals} onOpen={() => {}} />);
    ['Б', 'Ж', 'У', 'Кл', 'Ккал', 'Вода'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(screen.getByText('12')).toBeInTheDocument(); // 12.4 → 12
    expect(screen.getByText('241')).toBeInTheDocument(); // 240.7 → 241
  });

  it('shows an em-dash for a missing nutrient', () => {
    render(<NutrientsBar totals={{ '1': 10 }} onOpen={() => {}} />);
    expect(screen.getAllByText('—').length).toBe(5); // 5 из 6 нутриентов отсутствуют
  });

  it('opens the breakdown when the whole bar is tapped', () => {
    const onOpen = vi.fn();
    render(<NutrientsBar totals={totals} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Показать все нутриенты за день' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});

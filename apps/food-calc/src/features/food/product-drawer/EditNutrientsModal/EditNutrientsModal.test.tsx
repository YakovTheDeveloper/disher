// @vitest-environment jsdom
// EditNutrientsModal — draft + confirm: правки копятся в локальном draft,
// whole-replace в Dexie — ОДИН раз по «Сохранить», отмена (onBack) не пишет.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({
  nutrients: [
    { nutrientId: '1', quantity: 10 },
    { nutrientId: '2', quantity: 5 },
  ] as { nutrientId: string; quantity: number }[],
  setProductNutrients: vi.fn((_id: string, _json: string) => Promise.resolve()),
  // Последние пропы тела-редактора — драйвим правки отсюда.
  editor: { values: {} as Record<string, number>, onChange: (_id: string, _v: number) => {} },
}));

vi.mock('@/entities/product', () => ({
  useProduct: () => ({ id: 'p1', name: 'молоко', servingBasis: '100g', description: '' }),
  useProductNutrients: () => ({ results: h.nutrients }),
  setProductNutrients: h.setProductNutrients,
}));

// Каркас модалки — passthrough; тестируем draft/confirm-семантику, не shell.
vi.mock('@/shared/ui/ModalLayout', () => ({
  ModalLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/shared/ui/ModalShell', () => ({
  ModalShell: Object.assign(
    ({ children }: { children: ReactNode }) => <div>{children}</div>,
    {
      Header: ({ onBack }: { title: string; onBack: () => void }) => (
        <button type="button" aria-label="Назад" onClick={onBack} />
      ),
      Body: ({ children }: { children: ReactNode }) => <div>{children}</div>,
      Spacer: () => null,
      ActionButtons: ({ right }: { debugId: string; right?: ReactNode }) => <div>{right}</div>,
    }
  ),
}));
vi.mock('@/shared/ui/ModalFooter', () => ({
  ModalNextButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));
vi.mock('@/features/food/nutrient-composition-editor', () => ({
  NutrientCompositionEditor: (props: {
    values: Record<string, number>;
    onChange: (id: string, v: number) => void;
  }) => {
    h.editor = props;
    return <div data-testid="editor" />;
  },
}));

import { EditNutrientsModal } from './EditNutrientsModal';

describe('EditNutrientsModal — draft + confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.nutrients = [
      { nutrientId: '1', quantity: 10 },
      { nutrientId: '2', quantity: 5 },
    ];
  });

  it('инициализирует draft из live-query', () => {
    render(<EditNutrientsModal productId="p1" onClose={() => {}} />);
    expect(h.editor.values).toEqual({ '1': 10, '2': 5 });
  });

  it('правка НЕ пишет в Dexie до confirm', () => {
    render(<EditNutrientsModal productId="p1" onClose={() => {}} />);
    act(() => h.editor.onChange('1', 0));
    act(() => h.editor.onChange('1', 0.5));
    expect(h.setProductNutrients).not.toHaveBeenCalled();
    expect(h.editor.values['1']).toBe(0.5);
  });

  it('confirm: whole-replace один раз, нулевые ключи удалены, модалка закрыта', () => {
    const onClose = vi.fn();
    render(<EditNutrientsModal productId="p1" onClose={onClose} />);
    act(() => h.editor.onChange('1', 0));
    act(() => h.editor.onChange('3', 7));

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(h.setProductNutrients).toHaveBeenCalledTimes(1);
    expect(h.setProductNutrients).toHaveBeenCalledWith(
      'p1',
      JSON.stringify({ '2': 5, '3': 7 })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('onBack: отмена без записи', () => {
    const onClose = vi.fn();
    render(<EditNutrientsModal productId="p1" onClose={onClose} />);
    act(() => h.editor.onChange('1', 42));

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));

    expect(h.setProductNutrients).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

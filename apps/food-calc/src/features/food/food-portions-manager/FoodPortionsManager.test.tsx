import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FoodPortionsManager from './FoodPortionsManager';

afterEach(() => {
  vi.useRealTimers();
});

describe('FoodPortionsManager (editable)', () => {
  it('в покое ячейка — текст, тап превращает её в input (toggle, как HomePage qty)', () => {
    render(
      <FoodPortionsManager
        portions={[{ label: 'миска', grams: 250 }]}
        unit="г"
        showHint={false}
        onUpdate={vi.fn()}
        onLongPressRow={vi.fn()}
      />,
    );
    // Сырого input'а в покое нет — только текст.
    expect(screen.getByText('миска')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('название')).not.toBeInTheDocument();
    // Тап → input с текущим значением.
    fireEvent.click(screen.getByText('миска'));
    expect(screen.getByDisplayValue('миска')).toBeInTheDocument();
  });

  it('long-press по строке зовёт onLongPressRow(label)', () => {
    vi.useFakeTimers();
    const onLongPressRow = vi.fn();
    render(
      <FoodPortionsManager
        portions={[{ label: 'миска', grams: 250 }]}
        unit="г"
        showHint={false}
        onUpdate={vi.fn()}
        onLongPressRow={onLongPressRow}
      />,
    );
    fireEvent.pointerDown(screen.getByText('миска'), { button: 0 });
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(onLongPressRow).toHaveBeenCalledWith('миска');
  });

  it('переименование в дубль (без учёта регистра) откатывается — onUpdate не зовётся', () => {
    const onUpdate = vi.fn();
    render(
      <FoodPortionsManager
        portions={[
          { label: 'миска', grams: 250 },
          { label: 'тарелка', grams: 100 },
        ]}
        unit="г"
        showHint={false}
        onUpdate={onUpdate}
        onLongPressRow={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('тарелка'));
    const input = screen.getByDisplayValue('тарелка');
    fireEvent.change(input, { target: { value: 'МИСКА' } });
    fireEvent.blur(input);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('валидное переименование коммитит onUpdate', () => {
    const onUpdate = vi.fn();
    render(
      <FoodPortionsManager
        portions={[{ label: 'тарелка', grams: 100 }]}
        unit="г"
        showHint={false}
        onUpdate={onUpdate}
        onLongPressRow={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('тарелка'));
    const input = screen.getByDisplayValue('тарелка');
    fireEvent.change(input, { target: { value: 'блюдце' } });
    fireEvent.blur(input);
    expect(onUpdate).toHaveBeenCalledWith('тарелка', { label: 'блюдце' });
  });
});

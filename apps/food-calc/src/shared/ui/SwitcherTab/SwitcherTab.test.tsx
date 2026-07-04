import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { SwitcherTab } from './SwitcherTab';

// Активный таб инертен (юзер-канон 2026-07-03): ты уже на нём. Клик не должен
// звать onClick, и таб уходит из tab-order (tabIndex=-1). Неактивный — обычная
// кнопка навигации. (pointer-events:none — визуальная страховка; в jsdom нет
// layout, поэтому здесь проверяется именно JS-контракт: снятый onClick.)
describe('SwitcherTab active-tab inert contract', () => {
  it('does NOT fire onClick when active, and drops out of tab-order', () => {
    const onClick = vi.fn();
    render(<SwitcherTab label="Рацион" active onClick={onClick} />);
    const btn = screen.getByRole('button', { name: 'Рацион' });
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    expect(btn).toHaveAttribute('tabindex', '-1');
  });

  it('fires onClick when inactive, and stays in tab-order', () => {
    const onClick = vi.fn();
    render(<SwitcherTab label="Открытия" onClick={onClick} />);
    const btn = screen.getByRole('button', { name: 'Открытия' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(btn).not.toHaveAttribute('tabindex', '-1');
  });
});

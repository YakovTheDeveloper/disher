// @vitest-environment jsdom
// NormFlagButton — флажок нормы для хедеров дроверов. Синяя точка (dot) горит
// ТОЛЬКО когда норма точно не задана (items загрузились и пусты); тихо во время
// загрузки. По клику открывает DailyNormModal через modalStore.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const h = vi.hoisted(() => ({
  items: undefined as Record<string, number> | null | undefined,
  show: vi.fn(),
}));

vi.mock('@/entities/daily-norm', () => ({ useUserNormItems: () => h.items }));
vi.mock('@/shared/ui', () => ({ modalStore: { show: h.show } }));
vi.mock('@/features/dailyNorms/OpenDailyNorms/DailyNormModal', () => ({ default: () => null }));
vi.mock('@/shared/assets/icons/flag.svg?react', () => ({ default: () => null }));
// Стаб IconButton: проверяем ЛОГИКУ NormFlagButton (какие props он выбирает),
// не внутренний DOM примитива. `dot` выносим на data-атрибут для ассертов.
vi.mock('@/shared/ui/atoms/Button', () => ({
  IconButton: ({
    'aria-label': label,
    dot,
    onClick,
  }: {
    'aria-label': string;
    dot?: boolean;
    onClick?: () => void;
  }) => (
    <button aria-label={label} data-dot={dot ? 'true' : undefined} onClick={onClick} />
  ),
}));

import { NormFlagButton } from './NormFlagButton';
import DailyNormModal from '@/features/dailyNorms/OpenDailyNorms/DailyNormModal';

describe('NormFlagButton', () => {
  beforeEach(() => h.show.mockClear());

  it('hides the dot while the norm is loading (no wrong-state flash)', () => {
    h.items = undefined;
    const { getByRole } = render(<NormFlagButton />);
    const btn = getByRole('button', { name: 'Суточная норма' });
    expect(btn).not.toHaveAttribute('data-dot');
  });

  it('shows the dot + «Установить» label when no norm is set', () => {
    h.items = {};
    const { getByRole } = render(<NormFlagButton />);
    const btn = getByRole('button', { name: 'Установить суточную норму' });
    expect(btn).toHaveAttribute('data-dot', 'true');
  });

  it('hides the dot when a norm exists', () => {
    h.items = { '1': 100 };
    const { getByRole } = render(<NormFlagButton />);
    const btn = getByRole('button', { name: 'Суточная норма' });
    expect(btn).not.toHaveAttribute('data-dot');
  });

  it('opens DailyNormModal on click', () => {
    h.items = {};
    const { getByRole } = render(<NormFlagButton />);
    fireEvent.click(getByRole('button'));
    expect(h.show).toHaveBeenCalledTimes(1);
    expect(h.show).toHaveBeenCalledWith(DailyNormModal, {});
  });
});

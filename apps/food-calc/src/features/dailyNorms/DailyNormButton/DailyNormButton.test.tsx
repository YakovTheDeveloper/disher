// @vitest-environment jsdom
// DailyNormButton — тихая кнопка нормы вверху Nutrients. Loading-aware лейбл
// (нейтральный пока норма грузится, потом посмотреть/задать), по клику открывает
// DailyNormDrawer через drawerStore.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const h = vi.hoisted(() => ({
  items: undefined as Record<string, number> | null | undefined,
  show: vi.fn(),
}));

vi.mock('@/entities/daily-norm', () => ({ useUserNormItems: () => h.items }));
vi.mock('@/shared/ui/drawer-store', () => ({ drawerStore: { show: h.show } }));
vi.mock('@/features/dailyNorms/DailyNormDrawer', () => ({ DailyNormDrawer: () => null }));

import { DailyNormButton } from './DailyNormButton';

describe('DailyNormButton', () => {
  beforeEach(() => h.show.mockClear());

  it('shows a neutral label while the norm is loading (no wrong-state flash)', () => {
    h.items = undefined;
    const { getByText } = render(<DailyNormButton />);
    expect(getByText('Норма')).toBeInTheDocument();
  });

  it('reads «Установить суточную норму» when no norm is set', () => {
    h.items = {};
    const { getByText } = render(<DailyNormButton />);
    expect(getByText('Установить суточную норму')).toBeInTheDocument();
  });

  it('reads «Норма» when a norm exists', () => {
    h.items = { '1': 100 };
    const { getByText } = render(<DailyNormButton />);
    expect(getByText('Норма')).toBeInTheDocument();
  });

  it('opens DailyNormDrawer on click', () => {
    h.items = { '1': 100 };
    const { getByRole } = render(<DailyNormButton />);
    fireEvent.click(getByRole('button'));
    expect(h.show).toHaveBeenCalledTimes(1);
  });
});

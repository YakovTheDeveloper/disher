// @vitest-environment jsdom
// DailyNormButton — тихая кнопка нормы вверху Nutrients. Loading-aware лейбл
// (нейтральный пока норма грузится, потом посмотреть/задать), по клику открывает
// НАПРЯМУЮ модалку через modalStore: норма есть → EditDailyNormModal, нет →
// CreateDailyNormModal.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const h = vi.hoisted(() => ({
  items: undefined as Record<string, number> | null | undefined,
  show: vi.fn(),
}));

vi.mock('@/entities/daily-norm', () => ({ useUserNormItems: () => h.items }));
vi.mock('@/shared/ui', () => ({ modalStore: { show: h.show } }));
vi.mock('@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal', () => ({
  default: () => null,
}));
vi.mock('@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal', () => ({
  default: () => null,
}));

import { DailyNormButton } from './DailyNormButton';
import CreateDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal';
import EditDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal';

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

  it('opens EditDailyNormModal («Моя норма») when a norm exists', () => {
    h.items = { '1': 100 };
    const { getByRole } = render(<DailyNormButton />);
    fireEvent.click(getByRole('button'));
    expect(h.show).toHaveBeenCalledTimes(1);
    expect(h.show).toHaveBeenCalledWith(EditDailyNormModal, {});
  });

  it('opens CreateDailyNormModal («Новая норма») when no norm is set', () => {
    h.items = {};
    const { getByRole } = render(<DailyNormButton />);
    fireEvent.click(getByRole('button'));
    expect(h.show).toHaveBeenCalledTimes(1);
    expect(h.show).toHaveBeenCalledWith(CreateDailyNormModal, {});
  });
});

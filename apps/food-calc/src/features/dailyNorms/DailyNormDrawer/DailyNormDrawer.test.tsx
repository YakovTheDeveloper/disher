// @vitest-environment jsdom
// DailyNormDrawer — bottom-sheet настроек нормы. Двусостояние view↔create
// (переехало из удалённого useNutrientNormSlots). Панели Create/Edit и
// DrawerLayout застаблены; проверяем выбор ветки по useUserNormItems
// (loading / нет нормы / есть норма) и recalc↔back.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({ items: undefined as Record<string, number> | null | undefined }));

vi.mock('@/entities/daily-norm', () => ({
  useUserNormItems: () => h.items,
  USER_NORM_NAME: 'Моя норма',
}));
vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <button data-testid="create" onClick={onClose}>create</button>
  ),
}));
vi.mock('@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal', () => ({
  default: ({ onRecalc }: { onRecalc?: () => void }) => (
    <button data-testid="edit" onClick={onRecalc}>edit</button>
  ),
}));

const { DailyNormDrawer } = await import('./DailyNormDrawer');

const noop = () => {};

describe('DailyNormDrawer', () => {
  it('shows neither panel while the norm is loading', () => {
    h.items = undefined;
    render(<DailyNormDrawer onClose={noop} />);
    expect(screen.queryByTestId('create')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit')).not.toBeInTheDocument();
  });

  it('shows the survey (create) when no norm is set', () => {
    h.items = {};
    render(<DailyNormDrawer onClose={noop} />);
    expect(screen.getByTestId('create')).toBeInTheDocument();
  });

  it('shows the norm view (edit) when a norm exists', () => {
    h.items = { '1': 100 };
    render(<DailyNormDrawer onClose={noop} />);
    expect(screen.getByTestId('edit')).toBeInTheDocument();
  });

  it('recalc swaps view → survey with a back button, back returns to view', () => {
    h.items = { '1': 100 };
    render(<DailyNormDrawer onClose={noop} />);

    fireEvent.click(screen.getByTestId('edit')); // onRecalc
    expect(screen.getByTestId('create')).toBeInTheDocument();
    const back = screen.getByRole('button', { name: 'Назад к норме' });
    fireEvent.click(back);
    expect(screen.getByTestId('edit')).toBeInTheDocument();
  });

  it('fresh user: once the norm appears, the drawer flips survey → view', () => {
    // No norm → survey. Then useUserNormItems emits the freshly-created norm
    // (simulated via rerender, as a live-query emission would) → view.
    h.items = {};
    const { rerender } = render(<DailyNormDrawer onClose={noop} />);
    expect(screen.getByTestId('create')).toBeInTheDocument();

    h.items = { '1': 100 };
    rerender(<DailyNormDrawer onClose={noop} />);
    expect(screen.getByTestId('edit')).toBeInTheDocument();
  });

  it('committing the recalc survey (onClose) lands back on view, not closes', () => {
    h.items = { '1': 100 };
    render(<DailyNormDrawer onClose={noop} />);

    fireEvent.click(screen.getByTestId('edit')); // onRecalc → survey
    expect(screen.getByTestId('create')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('create')); // CreateModal onClose = goBackToView
    expect(screen.getByTestId('edit')).toBeInTheDocument();
  });
});

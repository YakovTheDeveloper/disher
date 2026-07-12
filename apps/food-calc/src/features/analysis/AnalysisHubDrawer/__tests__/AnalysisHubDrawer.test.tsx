// AnalysisHubDrawer — the «Разбор» hub. The heavy shell (DrawerLayout), the modal
// store, router, and the two data hooks are stubbed so the test isolates the
// drawer's own daily-gate logic: «Разобрать день» is disabled (with its reason in
// the row's caption) when offline or on an empty day, and opens the clarification
// modal only when enabled.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

const mockShow = vi.fn();
vi.mock('@/shared/ui', () => ({
  modalStore: { show: (...a: unknown[]) => mockShow(...a) },
}));

const mockDrawerShow = vi.fn();
vi.mock('@/shared/ui/drawer-store', () => ({
  drawerStore: { show: (...a: unknown[]) => mockDrawerShow(...a) },
}));

// Также рендерим topRight (ⓘ), чтобы кнопка попала в DOM теста.
vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children, topRight }: { children: ReactNode; topRight?: ReactNode }) => (
    <div>{topRight}<div>{children}</div></div>
  ),
}));

// Тяжёлый граф импорта объяснялки не нужен для gate-логики — глушим до `() => null`.
vi.mock('../AboutDiscoveriesDrawer', () => ({ AboutDiscoveriesDrawer: () => null }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

// A transitive import (toaster → @/app/router) runs `createBrowserRouter` at module
// load, which the bare react-router-dom mock above can't satisfy. Stub the router
// module so that heavy graph never loads.
vi.mock('@/app/router', () => ({ router: { navigate: vi.fn() } }));

const foods = vi.fn();
const events = vi.fn();
vi.mock('@/entities/schedule-food', () => ({ useScheduleFoods: () => foods() }));
vi.mock('@/entities/schedule-event', () => ({ useScheduleEvents: () => events() }));

const online = vi.fn();
vi.mock('@/shared/lib/hooks/useOnline', () => ({ useOnline: () => online() }));

vi.mock('../AnalysisClarificationModal', () => ({ AnalysisClarificationModal: () => null }));
vi.mock('../long', () => ({ CreateLongAnalysisModal: () => null }));

const AnalysisHubDrawer = (await import('../AnalysisHubDrawer')).default;
// Та же мок-ссылка, что видит компонент (модуль замокан выше) — сверяем identity.
const { AboutDiscoveriesDrawer } = await import('../AboutDiscoveriesDrawer');

beforeEach(() => {
  mockShow.mockReset();
  mockDrawerShow.mockReset();
  mockNavigate.mockReset();
  foods.mockReturnValue([{ id: '1' }]);
  events.mockReturnValue([]);
  online.mockReturnValue(true);
});

describe('AnalysisHubDrawer — daily gate', () => {
  it('enables «Разобрать день» online on a non-empty day and opens the modal on click', () => {
    render(<AnalysisHubDrawer date="15-03-2026" onClose={vi.fn()} />);
    const row = screen.getByRole('button', { name: /Разобрать день/i });
    expect(row).not.toBeDisabled();
    fireEvent.click(row);
    expect(mockShow).toHaveBeenCalledOnce();
  });

  it('disables «Разобрать день» offline, shows the reason, and does not open the modal', () => {
    online.mockReturnValue(false);
    render(<AnalysisHubDrawer date="15-03-2026" onClose={vi.fn()} />);
    const row = screen.getByRole('button', { name: /Разобрать день/i });
    expect(row).toBeDisabled();
    expect(screen.getByText('Нет сети — разбор дня недоступен')).toBeInTheDocument();
    fireEvent.click(row);
    expect(mockShow).not.toHaveBeenCalled();
  });

  it('disables «Разобрать день» for an empty day with its reason', () => {
    foods.mockReturnValue([]);
    events.mockReturnValue([]);
    render(<AnalysisHubDrawer date="15-03-2026" onClose={vi.fn()} />);
    const row = screen.getByRole('button', { name: /Разобрать день/i });
    expect(row).toBeDisabled();
    expect(screen.getByText('За этот день пока ничего не записано')).toBeInTheDocument();
  });

  it('hides «Страница открытий» when hideDiscoveriesLink is set', () => {
    render(<AnalysisHubDrawer date="15-03-2026" onClose={vi.fn()} hideDiscoveriesLink />);
    expect(screen.queryByText('Страница открытий')).not.toBeInTheDocument();
  });

  it('ⓘ opens the About drawer stacked over the hub', () => {
    render(<AnalysisHubDrawer date="15-03-2026" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Об открытиях/i }));
    expect(mockDrawerShow).toHaveBeenCalledOnce();
    expect(mockDrawerShow.mock.calls[0][0]).toBe(AboutDiscoveriesDrawer);
  });
});

// The two rows that leave the hub for /analyses. «Разобрать недели» is NOT gated
// by the daily rules (offline / empty day) — the long analysis spans other days —
// and it only navigates once the create modal resolves with a fresh pending row,
// which /analyses then seeds optimistically via `state.justStarted`.
describe('AnalysisHubDrawer — exits to /analyses', () => {
  it('«Разобрать недели» hands the created row to /analyses via state.justStarted', async () => {
    const created = { id: 'a1' };
    mockShow.mockResolvedValue(created);
    const onClose = vi.fn();
    render(<AnalysisHubDrawer date="15-03-2026" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Разобрать недели/i }));

    expect(onClose).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/analyses', {
        state: { justStarted: created },
      })
    );
  });

  it('«Разобрать недели» stays put when the create modal is dismissed', async () => {
    mockShow.mockResolvedValue(undefined);
    render(<AnalysisHubDrawer date="15-03-2026" onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Разобрать недели/i }));

    await waitFor(() => expect(mockShow).toHaveBeenCalledOnce());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('«Разобрать недели» is enabled even offline on an empty day', () => {
    online.mockReturnValue(false);
    foods.mockReturnValue([]);
    render(<AnalysisHubDrawer date="15-03-2026" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Разобрать недели/i })).not.toBeDisabled();
  });

  it('«Страница открытий» closes the hub and navigates to /analyses', () => {
    const onClose = vi.fn();
    render(<AnalysisHubDrawer date="15-03-2026" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Страница открытий/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/analyses');
  });
});

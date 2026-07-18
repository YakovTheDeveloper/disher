// @vitest-environment jsdom
// HomeTopBar — date-button `noInterruptGuard` behaviour.
// The flag skips the `selectedDate === date` early-return: product / dish
// pages feed a service date and want a same-date pick to STILL navigate, while
// HomePage (flag off) treats a same-date pick as a no-op. (The former
// daily-stream interrupt confirm was removed 2026-07-02 — the daily analysis is
// now a persisted POST job, so there is no stream to interrupt.)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomeTopBar from '../HomeTopBar';

const h = vi.hoisted(() => ({
  drawerShow: vi.fn(),
  toScheduleBuilder: vi.fn(),
}));

vi.mock('../HomeTopBar.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `htb-${String(p)}` }),
}));
vi.mock('@/shared/ui', () => ({
  drawerStore: { show: h.drawerShow },
}));
vi.mock('@/features/schedule-navigator', () => ({
  ScheduleNavigatorDrawer: () => null,
  // Detent'ы шторки навигации — HomeTopBar передаёт их третьим аргументом
  // drawerStore.show. Мок обязан отдать их: vitest бросает на отсутствующий
  // named-export.
  SCHEDULE_NAV_SNAP_POINTS: [0.5, 1],
  SCHEDULE_NAV_DEFAULT_SNAP: 0.5,
}));
vi.mock('@/features/analysis/AnalysisHubDrawer', () => ({ AnalysisHubDrawer: () => null }));
vi.mock('@/features/auth', () => ({ AccountPanel: () => null }));
vi.mock('@/shared/lib/routing/useAppRoutes', () => ({
  useAppRoutes: () => ({ toScheduleBuilder: h.toScheduleBuilder }),
}));

const DATE = '15-05-2026';
const NEW_DATE = '20-05-2026';

const clickDate = () => fireEvent.click(screen.getByLabelText('Выбрать дату'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HomeTopBar — noInterruptGuard', () => {
  it('picking a different date always navigates', async () => {
    h.drawerShow.mockResolvedValue(NEW_DATE);

    render(<HomeTopBar date={DATE} />);
    clickDate();

    await waitFor(() => expect(h.toScheduleBuilder).toHaveBeenCalledWith(NEW_DATE));
  });

  it('with the flag: selectedDate === date still navigates', async () => {
    h.drawerShow.mockResolvedValue(DATE); // юзер выбрал ту же дату

    render(<HomeTopBar date={DATE} noInterruptGuard />);
    clickDate();

    await waitFor(() => expect(h.toScheduleBuilder).toHaveBeenCalledWith(DATE));
  });

  it('without the flag: selectedDate === date → no navigation (early return)', async () => {
    h.drawerShow.mockResolvedValue(DATE);

    render(<HomeTopBar date={DATE} />);
    clickDate();

    // wait one tick для drawer promise resolve — после ничего не должно случиться.
    await new Promise((r) => setTimeout(r, 0));
    expect(h.toScheduleBuilder).not.toHaveBeenCalled();
  });
});

describe('HomeTopBar — date button content', () => {
  it('renders only the weekday (casing via CSS, day-of-month hidden)', () => {
    // DATE = 15-05-2026 → пятница. Аббревиатуру отдаём СЫРУЮ строчную («пт») —
    // casing («Пт») несёт CSS text-transform: capitalize, не строка. Число дня
    // временно скрыто (2026-07-18 — оставлен только день недели).
    render(<HomeTopBar date={DATE} />);
    const btn = screen.getByLabelText('Выбрать дату');

    expect(btn.textContent).toContain('пт');
    // Число дня и старый мета dd.mm НЕ рендерятся — только день недели.
    expect(btn.textContent).not.toMatch(/\d/);
  });
});

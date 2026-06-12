// @vitest-environment jsdom
// HomeTopBar — date-button interrupt guard.
// `noInterruptGuard` must skip BOTH the "analysis still streaming" confirm
// AND the `interrupt(date, 'date-switch')` call when the bar's date has a
// streaming daily analysis. Product / dish pages set the flag; HomePage
// leaves it off so leaving a displayed date still aborts its stream.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomeTopBar from '../HomeTopBar';

const h = vi.hoisted(() => ({
  drawerShow: vi.fn(),
  modalShow: vi.fn(),
  toScheduleBuilder: vi.fn(),
  interrupt: vi.fn(),
  byDate: {} as Record<string, { status: string }>,
}));

vi.mock('../HomeTopBar.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `htb-${String(p)}` }),
}));
vi.mock('@/shared/ui', () => ({
  drawerStore: { show: h.drawerShow },
  modalStore: { show: h.modalShow },
}));
vi.mock('@/shared/ui/ConfirmModal', () => ({ ConfirmModal: () => null }));
vi.mock('@/features/schedule-navigator', () => ({ ScheduleNavigatorDrawer: () => null }));
vi.mock('@/features/auth', () => ({ AccountPanel: () => null }));
vi.mock('@/app/routing/useAppRoutes', () => ({
  useAppRoutes: () => ({ toScheduleBuilder: h.toScheduleBuilder }),
}));
vi.mock('@/features/analysis/daily', () => ({
  useDailyAnalysisStore: {
    getState: () => ({ byDate: h.byDate, interrupt: h.interrupt }),
  },
}));
vi.mock('@/shared/lib/useDesignVariant', () => ({
  useDesignVariant: () => ({ variant: 'floating', anchor: {} }),
}));

const DATE = '15-05-2026';
const NEW_DATE = '20-05-2026';

const clickDate = () => fireEvent.click(screen.getByLabelText('Выбрать дату'));

beforeEach(() => {
  vi.clearAllMocks();
  h.byDate = {};
});

describe('HomeTopBar — noInterruptGuard', () => {
  it('with the flag: a streaming date → no confirm, no interrupt, just navigates', async () => {
    h.drawerShow.mockResolvedValue(NEW_DATE);
    h.byDate[DATE] = { status: 'loading' };

    render(<HomeTopBar date={DATE} noInterruptGuard />);
    clickDate();

    await waitFor(() => expect(h.toScheduleBuilder).toHaveBeenCalledWith(NEW_DATE));
    expect(h.modalShow).not.toHaveBeenCalled();
    expect(h.interrupt).not.toHaveBeenCalled();
  });

  it('without the flag: a streaming date → shows the confirm', async () => {
    h.drawerShow.mockResolvedValue(NEW_DATE);
    h.modalShow.mockResolvedValue(false); // user stays
    h.byDate[DATE] = { status: 'loading' };

    render(<HomeTopBar date={DATE} />);
    clickDate();

    await waitFor(() => expect(h.modalShow).toHaveBeenCalledTimes(1));
    // user declined → no navigation, no interrupt
    expect(h.interrupt).not.toHaveBeenCalled();
    expect(h.toScheduleBuilder).not.toHaveBeenCalled();
  });

  it('without the flag: confirming the streaming date → interrupts then navigates', async () => {
    h.drawerShow.mockResolvedValue(NEW_DATE);
    h.modalShow.mockResolvedValue(true); // user confirms leaving
    h.byDate[DATE] = { status: 'loading' };

    render(<HomeTopBar date={DATE} />);
    clickDate();

    await waitFor(() => expect(h.toScheduleBuilder).toHaveBeenCalledWith(NEW_DATE));
    expect(h.interrupt).toHaveBeenCalledWith(DATE, 'date-switch');
  });

  // На product/dish-страницах `date` — это lastVisitedScheduleDate (service-
  // дата, не дата на которой мы стоим). Если юзер выбирает «ту же» дату в
  // ScheduleNavigatorDrawer, он всё равно хочет уйти в /schedule/<date>.
  // Без noInterruptGuard ранний return на equality давит навигацию (HomePage
  // case — мы уже на этой дате, навигация бессмысленна).
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

    // wait one tick для drawer promise resolve — после ничего не должно
    // случиться.
    await new Promise((r) => setTimeout(r, 0));
    expect(h.toScheduleBuilder).not.toHaveBeenCalled();
    expect(h.modalShow).not.toHaveBeenCalled();
  });
});

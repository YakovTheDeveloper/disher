// @vitest-environment jsdom
// ScheduleNavigatorDrawer — the two ways out of the drawer, both resolving it with
// a date: the round quick-nav anchors (RoundButton in button-mode) and the month
// calendars («Дни с активностью»). Both funnel through onSelect→onClose(date).
// DrawerLayout + the Dexie date-key hook + i18n are stubbed so the test isolates
// that wiring; `filledKeys` is swapped per-suite to hit the empty vs active branch.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// Fixed clock (15 May 2026); `filledKeys` is per-test so one suite can render the
// EmptyState branch and the other the real month grid.
const filledKeys = vi.fn<() => string[]>();
vi.mock('../hooks', () => ({
  useToday: () => new Date(2026, 4, 15),
  useFilledDateKeys: () => filledKeys(),
  deriveFilledDates: (keys?: string[]) => new Set(keys ?? []),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// jsdom has no layout engine and ships no scrollIntoView — the navigator calls it
// on mount to centre the selected/today cell. Stub it so the effect can run.
Element.prototype.scrollIntoView = vi.fn();

const { ScheduleNavigatorDrawer } = await import('../ScheduleNavigatorDrawer');
const { AllDaysHeader } = await import('../ScheduleNavigator');

beforeEach(() => {
  filledKeys.mockReturnValue([]);
});

describe('ScheduleNavigatorDrawer — quick nav', () => {
  it('clicking «завтра» resolves onClose with tomorrow’s date', () => {
    const onClose = vi.fn();
    render(<ScheduleNavigatorDrawer onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Завтра/i }));
    expect(onClose).toHaveBeenCalledWith('16-05-2026');
  });

  it('renders EmptyState instead of calendars when nothing is logged', () => {
    const { container } = render(<ScheduleNavigatorDrawer onClose={vi.fn()} />);
    expect(container.querySelector('[data-date]')).toBeNull();
  });
});

describe('ScheduleNavigatorDrawer — month calendars', () => {
  // Two logged days in May 2026 → one month group; the grid still renders EVERY
  // day of that month (empty days stay tappable), so a jump into an unlogged day
  // must work too. The calendars live on the SECOND drawer screen — every case
  // walks through the «Показать все дни» row first.
  beforeEach(() => {
    filledKeys.mockReturnValue(['12-05-2026', '14-05-2026']);
  });

  const openAllDays = () => fireEvent.click(screen.getByRole('button', { name: /все дни/i }));

  it('clicking a logged day resolves onClose with that date', () => {
    const onClose = vi.fn();
    const { container } = render(<ScheduleNavigatorDrawer onClose={onClose} />);
    openAllDays();
    const cell = container.querySelector<HTMLElement>('[data-date="12-05-2026"]');
    expect(cell).not.toBeNull();
    fireEvent.click(cell!);
    expect(onClose).toHaveBeenCalledWith('12-05-2026');
  });

  it('clicking an unlogged day in a rendered month also resolves', () => {
    const onClose = vi.fn();
    const { container } = render(<ScheduleNavigatorDrawer onClose={onClose} />);
    openAllDays();
    // 03-05-2026 has no records, but its month is on screen → still a jump target.
    fireEvent.click(container.querySelector<HTMLElement>('[data-date="03-05-2026"]')!);
    expect(onClose).toHaveBeenCalledWith('03-05-2026');
  });

  it('marks the selected day pressed and today as aria-current', () => {
    const { container } = render(
      <ScheduleNavigatorDrawer onClose={vi.fn()} selectedDate="12-05-2026" />
    );
    openAllDays();
    expect(
      container.querySelector('[data-date="12-05-2026"]')
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      container.querySelector('[data-date="15-05-2026"]')
    ).toHaveAttribute('aria-current', 'date');
  });

  it('the «all days» row is disabled when nothing is logged', () => {
    filledKeys.mockReturnValue([]);
    render(<ScheduleNavigatorDrawer onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /все дни/i })).toBeDisabled();
  });
});

describe('AllDaysHeader — month paging', () => {
  it('renders the shown month label and fires prev/next on the arrows', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <AllDaysHeader monthDate={new Date(2026, 4, 15)} onPrev={onPrev} onNext={onNext} />
    );
    // Month name (LLLL, ru) + 2-digit year — the screen title now IS the month.
    expect(screen.getByText("май'26")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Предыдущий месяц' }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Следующий месяц' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

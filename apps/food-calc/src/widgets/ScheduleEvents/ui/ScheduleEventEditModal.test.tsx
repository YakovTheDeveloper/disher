// Редактор события — правка аспектов `{label, value}` (модель ScaleAtom-only).
// Стережёт инвариант из критики 2026-07-15: хвостовая строка с дефолтной «5», но
// без лейбла, НЕ должна цеплять фантомную оценку; реальные (seeded) аспекты
// сохраняются даже если лейбл стёрли (число осмысленно).
import { render, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ScheduleEvent } from '@/entities/schedule-event';

const { updateScheduleEvent } = vi.hoisted(() => ({ updateScheduleEvent: vi.fn() }));
vi.mock('@/entities/schedule-event', async (importActual) => {
  const actual = await importActual<typeof import('@/entities/schedule-event')>();
  return { ...actual, updateScheduleEvent };
});

import ScheduleEventEditModal from './ScheduleEventEditModal';

const makeEvent = (over: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: 'ev-1',
  date: '02-07-2026',
  time: '10:00',
  endTime: '',
  text: 'болит спина',
  atoms: [{ kind: 'scale', value: 1, label: 'спина' }],
  createdAt: '2026-07-02T10:00:00.000Z',
  ...over,
});

// Все шаги всегда в DOM (ModalByLabel рендерит collapsed) — скоупим запросы в
// РАСКРЫТЫЙ шаг, иначе «Готово»/placeholder дублируются.
const expandedStep = () => document.querySelector('[data-modal-by-label="expanded"]') as HTMLElement;
const finish = (root: HTMLElement) => fireEvent.click(within(root).getByRole('button', { name: 'Готово' }));
const lastAtoms = () => updateScheduleEvent.mock.calls[0][1].atoms;

beforeEach(() => updateScheduleEvent.mockReset().mockResolvedValue(undefined));
afterEach(cleanup);

describe('ScheduleEventEditModal — правка аспектов', () => {
  it('правка value/label существующего аспекта сохраняется', async () => {
    render(<ScheduleEventEditModal item={makeEvent()} initialStep="atoms" onClose={() => {}} />);
    const step = expandedStep();
    const sliders = within(step).getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '8' } });
    finish(step);
    await waitFor(() => expect(updateScheduleEvent).toHaveBeenCalledTimes(1));
    expect(lastAtoms()).toEqual([{ kind: 'scale', value: 8, label: 'спина' }]);
  });

  it('стёртый лейбл у seeded-аспекта не удаляет его (число осмысленно)', async () => {
    render(<ScheduleEventEditModal item={makeEvent()} initialStep="atoms" onClose={() => {}} />);
    const step = expandedStep();
    fireEvent.change(within(step).getByDisplayValue('спина'), { target: { value: '' } });
    finish(step);
    await waitFor(() => expect(updateScheduleEvent).toHaveBeenCalledTimes(1));
    expect(lastAtoms()).toEqual([{ kind: 'scale', value: 1 }]);
  });

  it('хвостовая строка с дефолтной «5» без лейбла НЕ создаёт фантомную оценку', async () => {
    render(<ScheduleEventEditModal item={makeEvent({ atoms: [] })} initialStep="atoms" onClose={() => {}} />);
    const step = expandedStep();
    fireEvent.change(within(step).getAllByRole('slider')[0], { target: { value: '7' } });
    finish(step);
    await waitFor(() => expect(updateScheduleEvent).toHaveBeenCalledTimes(1));
    expect(lastAtoms()).toEqual([]);
  });

  it('лейбл на хвостовой строке материализует аспект', async () => {
    render(<ScheduleEventEditModal item={makeEvent({ atoms: [] })} initialStep="atoms" onClose={() => {}} />);
    const step = expandedStep();
    fireEvent.change(within(step).getByPlaceholderText('напр. Настроение'), { target: { value: 'тревога' } });
    finish(step);
    await waitFor(() => expect(updateScheduleEvent).toHaveBeenCalledTimes(1));
    expect(lastAtoms()).toEqual([{ kind: 'scale', value: 5, label: 'тревога' }]);
  });

  it('no-op правка текста не трогает аспекты', async () => {
    render(<ScheduleEventEditModal item={makeEvent()} initialStep="text" onClose={() => {}} />);
    finish(expandedStep());
    await waitFor(() => expect(updateScheduleEvent).toHaveBeenCalledTimes(1));
    expect(lastAtoms()).toEqual([{ kind: 'scale', value: 1, label: 'спина' }]);
  });
});

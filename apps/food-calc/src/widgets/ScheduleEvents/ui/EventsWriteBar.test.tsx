// EventsWriteBar — два пути добавления события (2026-07-15):
//   • ОНЛАЙН: инпут бара → LLM-разбор (parseFreeTextEvent) → review-панель
//     (текст + период + оценки) → batch-коммит через addScheduleEvent.
//   • ОФЛАЙН: медаль «Вручную» (label htmlFor) → форма EventCreateModal → коммит.
// Модалка/бар всегда в DOM; их инпуты запрашиваются напрямую, фокус главного
// инпута офлайн-модалки раскрывает её (onFocusCapture).
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const { addScheduleEvent } = vi.hoisted(() => ({ addScheduleEvent: vi.fn() }));
vi.mock('@/entities/schedule-event', async (importActual) => {
  const actual = await importActual<typeof import('@/entities/schedule-event')>();
  return { ...actual, addScheduleEvent };
});

// Мок схемы — коммит гоняет `db.transaction('rw', …, cb)`; здесь просто исполняем
// колбэк (реальный Dexie не нужен, addScheduleEvent замокан).
vi.mock('@/shared/lib/dexie/schema', () => ({
  db: {
    schedule_events: {},
    transaction: (_mode: string, _table: unknown, cb: () => Promise<unknown>) => cb(),
  },
}));

const { parseFreeTextEvent } = vi.hoisted(() => ({ parseFreeTextEvent: vi.fn() }));
vi.mock('../api/parseFreeTextEvent', () => ({ parseFreeTextEvent }));

// Онлайн-коммит гейтит `userId` (офлайн-путь — нет); в тестах авторизации нет.
vi.mock('@/shared/lib/auth/useUserId', () => ({ useUserId: () => 'test-user' }));

import EventsWriteBar from './EventsWriteBar';
import { EVENT_CREATE_MAIN_INPUT_ID, EVENT_WRITE_INPUT_ID } from './EventCreateModal.constants';

beforeEach(() => {
  addScheduleEvent.mockReset().mockResolvedValue('event-id');
  parseFreeTextEvent.mockReset();
});
afterEach(cleanup);

describe('EventsWriteBar — офлайн-форма («Вручную»)', () => {
  const openOffline = (text: string) => {
    const main = document.getElementById(EVENT_CREATE_MAIN_INPUT_ID) as HTMLTextAreaElement;
    fireEvent.focus(main); // onFocusCapture → раскрытие модалки
    fireEvent.change(main, { target: { value: text } });
    return main;
  };
  const finish = () => fireEvent.click(screen.getByRole('button', { name: 'Готово' }));

  it('текст + заполненный аспект → событие с одним ScaleAtom', async () => {
    render(<EventsWriteBar scheduleId="02-07-2026" />);
    openOffline('тяжёлый день');
    fireEvent.change(screen.getByPlaceholderText('напр. Тревога'), { target: { value: 'Тревога' } });
    fireEvent.change(screen.getByRole('slider', { name: /Тревога/ }), { target: { value: '8' } });
    finish();
    await waitFor(() => expect(addScheduleEvent).toHaveBeenCalledTimes(1));
    const arg = addScheduleEvent.mock.calls[0][0];
    expect(arg.text).toBe('тяжёлый день');
    expect(arg.atoms).toEqual([{ kind: 'scale', value: 8, label: 'Тревога' }]);
  });

  it('незаполненные аспекты отбрасываются (пустой label → нет атома)', async () => {
    render(<EventsWriteBar scheduleId="02-07-2026" />);
    openOffline('просто заметка без оценок');
    finish();
    await waitFor(() => expect(addScheduleEvent).toHaveBeenCalledTimes(1));
    expect(addScheduleEvent.mock.calls[0][0].atoms).toEqual([]);
  });
});

describe('EventsWriteBar — онлайн-разбор (LLM)', () => {
  const typeAndSend = (text: string) => {
    const bar = document.getElementById(EVENT_WRITE_INPUT_ID) as HTMLTextAreaElement;
    fireEvent.change(bar, { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
  };

  it('текст → разбор → review → коммит переносит период + оценку', async () => {
    parseFreeTextEvent.mockResolvedValue({
      requestId: 'r1',
      events: [
        { text: 'Сон', timeStart: '23:00', timeEnd: '07:00', aspects: [{ label: 'Качество сна', value: 6 }] },
      ],
    });
    render(<EventsWriteBar scheduleId="02-07-2026" />);
    typeAndSend('спал с 23 до 7, качество сна 6 из 10');

    await waitFor(() => expect(parseFreeTextEvent).toHaveBeenCalledTimes(1));
    const commitBtn = await screen.findByRole('button', { name: /Добавить/ });
    fireEvent.click(commitBtn);

    await waitFor(() => expect(addScheduleEvent).toHaveBeenCalledTimes(1));
    const arg = addScheduleEvent.mock.calls[0][0];
    expect(arg.time).toBe('23:00');
    expect(arg.endTime).toBe('07:00');
    expect(arg.text).toBe('Сон');
    expect(arg.atoms).toEqual([{ kind: 'scale', value: 6, label: 'Качество сна' }]);
  });

  it('несколько событий из одного сообщения → коммитит все включённые', async () => {
    parseFreeTextEvent.mockResolvedValue({
      requestId: 'r2',
      events: [
        { text: 'Сон', timeStart: '23:00', timeEnd: '07:00', aspects: [] },
        { text: 'Тренировка', timeStart: '18:00', timeEnd: null, aspects: [{ label: 'Энергия', value: 8 }] },
      ],
    });
    render(<EventsWriteBar scheduleId="02-07-2026" />);
    typeAndSend('поспал и потренировался');

    const commitBtn = await screen.findByRole('button', { name: /Добавить/ });
    fireEvent.click(commitBtn);

    await waitFor(() => expect(addScheduleEvent).toHaveBeenCalledTimes(2));
    const [first, second] = addScheduleEvent.mock.calls.map((c) => c[0]);
    expect(first.text).toBe('Сон');
    expect(first.endTime).toBe('07:00');
    expect(second.text).toBe('Тренировка');
    expect(second.endTime).toBeUndefined(); // timeEnd null → без периода
    expect(second.atoms).toEqual([{ kind: 'scale', value: 8, label: 'Энергия' }]);
  });
});

import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import EventsWriteBar from './EventsWriteBar';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';

// Событие валидно ДВУМЯ путями: описание ИЛИ хотя бы один атом-оценка (атом-only /
// текст-only — оба ок). Отсюда `computeSend={() => ({ visible: hasContent, … })}`,
// где hasContent = text OR atoms. Эта OR-ветка (монета видна БЕЗ текста, если есть
// атом) — неочевидная; тип-чек её не покрывает.
afterEach(() => {
  cleanup();
  useEventDraftStore.getState().clear();
});

describe('EventsWriteBar — send content-driven', () => {
  it('пусто (ни текста, ни атомов) → send-монеты нет', () => {
    render(<EventsWriteBar scheduleId="02-07-2026" />);
    expect(screen.queryByRole('button', { name: 'Добавить событие' })).toBeNull();
  });

  it('только атом, без текста → send-монета появляется', () => {
    render(<EventsWriteBar scheduleId="02-07-2026" />);
    // Атом сеем ПОСЛЕ монтирования: mount-эффект (clearAtoms по scheduleId) уже
    // отработал, иначе он бы стёр посев до ассерта.
    act(() => {
      useEventDraftStore.getState().addAtom({ kind: 'scale', value: 7 });
    });
    expect(screen.getByRole('button', { name: 'Добавить событие' })).toBeInTheDocument();
  });
});

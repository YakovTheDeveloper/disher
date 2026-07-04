import { describe, it, expect, beforeEach } from 'vitest';
import { markAdded, isJustAdded, takeJustAdded } from './recentlyAddedStore';

// Consume-once mailbox (2026-07-04): пишущий путь кладёт id (markAdded), ряд на
// маунте читает (isJustAdded) и потребляет (takeJustAdded). Нет реактивности, нет
// TTL, нет внешней чистки — одноразовый flash сам гасит себя CSS, а take() бьёт
// id при первом маунте ряда. Тесты гоняем на реальном времени (таймеров нет).

// Ящик — module-level Set: между кейсами вычищаем всё через take по известным id.
function drain(ids: string[]): void {
  for (const id of ids) takeJustAdded(id);
}

describe('recentlyAddedStore — consume-once mailbox', () => {
  beforeEach(() => {
    // Подчищаем возможные хвосты от предыдущих кейсов (id локальны, но CAP-тест
    // сыпет много) — берём с запасом.
    drain(Array.from({ length: 120 }, (_, i) => `x${i}`));
    drain(['a', 'b', 'c']);
  });

  it('markAdded помечает id → isJustAdded видит его', () => {
    expect(isJustAdded('a')).toBe(false);
    markAdded(['a']);
    expect(isJustAdded('a')).toBe(true);
  });

  it('takeJustAdded потребляет id → повторное чтение уже false (one-shot)', () => {
    markAdded(['a']);
    expect(isJustAdded('a')).toBe(true);
    takeJustAdded('a');
    expect(isJustAdded('a')).toBe(false);
  });

  it('markAdded пачкой помечает все id', () => {
    markAdded(['a', 'b']);
    expect(isJustAdded('a')).toBe(true);
    expect(isJustAdded('b')).toBe(true);
  });

  it('пустой markAdded — no-op', () => {
    markAdded([]);
    expect(isJustAdded('a')).toBe(false);
  });

  it('takeJustAdded по неизвестному id безвреден', () => {
    expect(() => takeJustAdded('never')).not.toThrow();
  });

  it('CAP отсекает старейшие сверх лимита (потерянный flash безвреден)', () => {
    // Кладём заведомо больше CAP=50; старейшие должны отвалиться, свежие — жить.
    const ids = Array.from({ length: 70 }, (_, i) => `x${i}`);
    markAdded(ids);
    // Последний добавленный точно в ящике.
    expect(isJustAdded('x69')).toBe(true);
    // Самый первый (старейший) вытеснен FIFO-отсечкой.
    expect(isJustAdded('x0')).toBe(false);
  });
});

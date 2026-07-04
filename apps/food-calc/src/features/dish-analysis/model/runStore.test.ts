import { beforeEach, describe, expect, it, vi } from 'vitest';

// runStore зовёт runDishAnalysis (module-scope запуск разбора). Мокаем сеть/idb.
vi.mock('../api/runDishAnalysis', () => ({ runDishAnalysis: vi.fn() }));

import { runDishAnalysis } from '../api/runDishAnalysis';
import { useDishRunStore } from './runStore';

const mockRun = vi.mocked(runDishAnalysis);

beforeEach(() => {
  // Стор — module-scope singleton: сбрасываем состояние и мок между тестами.
  useDishRunStore.setState({ runs: {} });
  mockRun.mockReset();
});

describe('runStore', () => {
  it('идемпотентен: второй start() при loading не шлёт второй запрос (один POST, без двойного charge)', async () => {
    let resolveRun!: (v: { summary: string; insights: [] }) => void;
    mockRun.mockReturnValue(
      new Promise((res) => {
        resolveRun = res;
      })
    );

    const { start } = useDishRunStore.getState();
    const p1 = start('d1');
    // Второй вызов, пока первый ещё loading — должен быть no-op.
    const p2 = start('d1');

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(useDishRunStore.getState().runs['d1']?.status).toBe('loading');

    resolveRun({ summary: 's', insights: [] });
    await Promise.all([p1, p2]);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(useDishRunStore.getState().runs['d1']?.status).toBe('done');
    expect(useDishRunStore.getState().runs['d1']?.result?.summary).toBe('s');
  });

  it('маппит ошибку в status:error с сообщением из Error.message (PaymentRequiredError → баланс)', async () => {
    mockRun.mockRejectedValue(new Error('Недостаточно средств'));

    await useDishRunStore.getState().start('d2');

    const run = useDishRunStore.getState().runs['d2'];
    expect(run?.status).toBe('error');
    expect(run?.error).toBe('Недостаточно средств');
  });

  it('после ошибки повторный start() перезапускает (error не блокирует, блокирует только loading)', async () => {
    mockRun.mockRejectedValueOnce(new Error('Сеть')).mockResolvedValueOnce({
      summary: 'ок',
      insights: [],
    });

    await useDishRunStore.getState().start('d3');
    expect(useDishRunStore.getState().runs['d3']?.status).toBe('error');

    await useDishRunStore.getState().start('d3');
    expect(mockRun).toHaveBeenCalledTimes(2);
    expect(useDishRunStore.getState().runs['d3']?.status).toBe('done');
  });

  it('clear удаляет запись запуска', async () => {
    mockRun.mockResolvedValue({ summary: 's', insights: [] });
    await useDishRunStore.getState().start('d4');
    expect(useDishRunStore.getState().runs['d4']?.status).toBe('done');

    useDishRunStore.getState().clear('d4');
    expect(useDishRunStore.getState().runs['d4']).toBeUndefined();
  });
});

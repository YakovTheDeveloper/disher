import { describe, it, expect, vi } from 'vitest';

const insertMock = vi.fn();

vi.mock('@/api/triplit/client', () => ({
  triplit: {
    insert: insertMock,
  },
}));

vi.mock('@/api/triplit/session', () => ({
  getCurrentUserId: vi.fn(() => 'test-user'),
}));

const { pasteClipboardItems } = await import('./mutations');

describe('pasteClipboardItems', () => {
  beforeEach(() => {
    insertMock.mockClear();
  });

  it('creates a schedule food for each clipboard item', async () => {
    await pasteClipboardItems(
      [
        { time: '08:00', type: 'food', quantity: 150, foodId: 'f1', dishId: null, displayName: 'Egg' },
        { time: '12:00', type: 'dish', quantity: 300, foodId: null, dishId: 'd1', displayName: 'Salad' },
      ],
      '26-03-2026',
    );

    expect(insertMock).toHaveBeenCalledTimes(2);

    const firstCall = insertMock.mock.calls[0];
    expect(firstCall[0]).toBe('scheduleFoods');
    expect(firstCall[1]).toMatchObject({
      date: '26-03-2026',
      time: '08:00',
      type: 'food',
      quantity: 150,
      foodId: 'f1',
      dishId: null,
      userId: 'test-user',
    });

    const secondCall = insertMock.mock.calls[1];
    expect(secondCall[0]).toBe('scheduleFoods');
    expect(secondCall[1]).toMatchObject({
      date: '26-03-2026',
      time: '12:00',
      type: 'dish',
      quantity: 300,
      foodId: null,
      dishId: 'd1',
      userId: 'test-user',
    });
  });

  it('handles empty items array without inserting', async () => {
    await pasteClipboardItems([], '26-03-2026');
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('preserves original time from clipboard items', async () => {
    await pasteClipboardItems(
      [{ time: '19:30', type: 'food', quantity: 200, foodId: 'f2', dishId: null, displayName: 'Rice' }],
      '27-03-2026',
    );

    expect(insertMock.mock.calls[0][1]).toMatchObject({
      date: '27-03-2026',
      time: '19:30',
    });
  });
});

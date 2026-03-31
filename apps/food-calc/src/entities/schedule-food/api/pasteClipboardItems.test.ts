import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Store } from '@livestore/livestore';

vi.mock('@/shared/lib/user', () => ({
  getCurrentUserId: vi.fn(() => 'test-user'),
}));

const mockCommit = vi.fn();
const store = { commit: mockCommit } as unknown as Store;

const { pasteClipboardItems } = await import('./mutations');

describe('pasteClipboardItems', () => {
  beforeEach(() => {
    mockCommit.mockClear();
  });

  it('creates a schedule food for each clipboard item', () => {
    pasteClipboardItems(
      store,
      [
        { time: '08:00', type: 'food' as const, quantity: 150, foodId: 'f1', dishId: null, displayName: 'Egg' },
        { time: '12:00', type: 'dish' as const, quantity: 300, foodId: null, dishId: 'd1', displayName: 'Salad' },
      ],
      '26-03-2026',
    );

    expect(mockCommit).toHaveBeenCalledTimes(1);
    const args = mockCommit.mock.calls[0];
    expect(args).toHaveLength(2);

    expect(args[0]).toMatchObject({
      args: expect.objectContaining({
        date: '26-03-2026',
        time: '08:00',
        type: 'food',
        quantity: 150,
        foodId: 'f1',
        userId: 'test-user',
      }),
    });

    expect(args[1]).toMatchObject({
      args: expect.objectContaining({
        date: '26-03-2026',
        time: '12:00',
        type: 'dish',
        quantity: 300,
        dishId: 'd1',
        userId: 'test-user',
      }),
    });
  });

  it('handles empty items array without committing events', () => {
    pasteClipboardItems(store, [], '26-03-2026');
    // commit called with spread of empty array = 0 event args
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it('preserves original time from clipboard items', () => {
    pasteClipboardItems(
      store,
      [{ time: '19:30', type: 'food' as const, quantity: 200, foodId: 'f2', dishId: null, displayName: 'Rice' }],
      '27-03-2026',
    );

    expect(mockCommit.mock.calls[0][0]).toMatchObject({
      args: expect.objectContaining({
        date: '27-03-2026',
        time: '19:30',
      }),
    });
  });
});

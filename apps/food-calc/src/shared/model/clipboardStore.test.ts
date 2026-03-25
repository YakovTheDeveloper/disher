import { describe, it, expect, beforeEach } from 'vitest';
import { useClipboardStore, type ClipboardItem } from './clipboardStore';

const makeItem = (overrides?: Partial<ClipboardItem>): ClipboardItem => ({
  time: '12:00',
  type: 'food',
  quantity: 100,
  foodId: 'food-1',
  dishId: null,
  displayName: 'Tomato',
  ...overrides,
});

describe('clipboardStore', () => {
  beforeEach(() => {
    useClipboardStore.getState().clearClipboard();
  });

  it('starts with empty clipboard', () => {
    const { items, sourceDate } = useClipboardStore.getState();
    expect(items).toEqual([]);
    expect(sourceDate).toBeNull();
  });

  it('copies items to clipboard', () => {
    const items = [makeItem(), makeItem({ foodId: 'food-2', displayName: 'Cucumber' })];
    useClipboardStore.getState().copyToClipboard(items, '25-03-2026');

    const state = useClipboardStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.items[0].displayName).toBe('Tomato');
    expect(state.items[1].displayName).toBe('Cucumber');
    expect(state.sourceDate).toBe('25-03-2026');
  });

  it('replaces clipboard on second copy', () => {
    useClipboardStore.getState().copyToClipboard([makeItem()], '25-03-2026');
    useClipboardStore.getState().copyToClipboard(
      [makeItem({ foodId: 'food-3', displayName: 'Rice' })],
      '26-03-2026',
    );

    const state = useClipboardStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].displayName).toBe('Rice');
    expect(state.sourceDate).toBe('26-03-2026');
  });

  it('clears clipboard', () => {
    useClipboardStore.getState().copyToClipboard([makeItem()], '25-03-2026');
    useClipboardStore.getState().clearClipboard();

    const state = useClipboardStore.getState();
    expect(state.items).toEqual([]);
    expect(state.sourceDate).toBeNull();
  });

  it('stores both food and dish type items', () => {
    const items = [
      makeItem({ type: 'food', foodId: 'f1', dishId: null }),
      makeItem({ type: 'dish', foodId: null, dishId: 'd1', displayName: 'Salad' }),
    ];
    useClipboardStore.getState().copyToClipboard(items, '25-03-2026');

    const state = useClipboardStore.getState();
    expect(state.items[0].type).toBe('food');
    expect(state.items[1].type).toBe('dish');
    expect(state.items[1].dishId).toBe('d1');
  });
});

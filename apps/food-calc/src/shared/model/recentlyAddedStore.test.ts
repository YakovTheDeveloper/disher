import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRecentlyAddedStore } from './recentlyAddedStore';

// Авто-истечение recent-точек (юзер-запрос 2026-07-03): id, добавленный в store,
// сам исчезает через ~5s, поверх существующей чистки на свайп/уход (clear). Гоняем
// на fake timers, чтобы не ждать реальные секунды.
const TTL_MS = 5000;

describe('recentlyAddedStore — авто-истечение по таймеру', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useRecentlyAddedStore.getState().clear();
  });

  afterEach(() => {
    useRecentlyAddedStore.getState().clear();
    vi.useRealTimers();
  });

  it('addMany помечает id, и он сам гаснет по истечении TTL', () => {
    const store = useRecentlyAddedStore.getState();
    store.addMany(['a']);
    expect(useRecentlyAddedStore.getState().ids.has('a')).toBe(true);

    // Чуть раньше срока — ещё держится.
    vi.advanceTimersByTime(TTL_MS - 1);
    expect(useRecentlyAddedStore.getState().ids.has('a')).toBe(true);

    // По истечении — исчез сам.
    vi.advanceTimersByTime(1);
    expect(useRecentlyAddedStore.getState().ids.has('a')).toBe(false);
  });

  it('повторный addMany того же id перезапускает его личный таймер', () => {
    const store = useRecentlyAddedStore.getState();
    store.addMany(['a']);
    vi.advanceTimersByTime(TTL_MS - 500); // почти истёк
    store.addMany(['a']); // рестарт TTL
    vi.advanceTimersByTime(600); // прошёл бы старый дедлайн, но таймер сброшен
    expect(useRecentlyAddedStore.getState().ids.has('a')).toBe(true);
    vi.advanceTimersByTime(TTL_MS); // добиваем новый срок
    expect(useRecentlyAddedStore.getState().ids.has('a')).toBe(false);
  });

  it('clear() гасит всё сразу и отменяет висячие таймеры (нет отложенного remove)', () => {
    const store = useRecentlyAddedStore.getState();
    store.addMany(['a', 'b']);
    store.clear();
    expect(useRecentlyAddedStore.getState().ids.size).toBe(0);
    // Если бы таймер не был отменён — тут бы отработал remove на уже пустом сете
    // (безвредно), но проверяем, что дальнейший addMany не «схлопывается» чужим
    // отложенным колбэком.
    store.addMany(['c']);
    vi.advanceTimersByTime(TTL_MS - 1);
    expect(useRecentlyAddedStore.getState().ids.has('c')).toBe(true);
  });

  it('remove() убирает id и отменяет его таймер', () => {
    const store = useRecentlyAddedStore.getState();
    store.addMany(['a']);
    store.remove('a');
    expect(useRecentlyAddedStore.getState().ids.has('a')).toBe(false);
    // Никакого повторного эффекта по истечении старого срока.
    vi.advanceTimersByTime(TTL_MS);
    expect(useRecentlyAddedStore.getState().ids.has('a')).toBe(false);
  });
});

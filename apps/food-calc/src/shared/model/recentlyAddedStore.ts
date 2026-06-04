import { create } from 'zustand';

// Эфемерный набор id «только что добавленных» строк расписания (еда + события).
// Помечает item «недавним» — потребители (ScheduleFoodItemInline,
// ScheduleEventCard) рисуют синий кружок справа. Чистится НЕ по таймеру, а на
// смену слайда Swipeable / уход со страницы (HomePage owns the clear) — поэтому
// здесь только примитивы add/remove/clear, без авто-истечения.
//
// Живёт в shared/model (а не в food-free-text-parse), потому что им пользуются
// оба виджета расписания — ровно как соседний itemTimesStore.
type State = {
  ids: Set<string>;
  addMany: (ids: string[]) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useRecentlyAddedStore = create<State>((set) => ({
  ids: new Set(),
  addMany: (newIds) =>
    set((s) => {
      if (newIds.length === 0) return s;
      const next = new Set(s.ids);
      for (const id of newIds) next.add(id);
      return { ids: next };
    }),
  remove: (id) =>
    set((s) => {
      if (!s.ids.has(id)) return s;
      const next = new Set(s.ids);
      next.delete(id);
      return { ids: next };
    }),
  clear: () => set((s) => (s.ids.size === 0 ? s : { ids: new Set() })),
}));

import { create } from 'zustand';

// Эфемерный набор id «только что добавленных» строк расписания (еда + события).
// Помечает item «недавним» — потребители (ScheduleFoodItemInline,
// ScheduleEventCard) рисуют синий кружок справа.
//
// Чистка ДВУХСТОРОННЯЯ (что раньше — то и гасит):
//  1. Авто-истечение по таймеру: каждый id живёт RECENT_TTL_MS, затем гаснет сам
//     (юзер-запрос 2026-07-03 — вернули таймер; ранее, 2026-06-03, его снимали в
//     пользу clear-on-swipe, но юзер захотел, чтобы точки уходили сами через
//     несколько секунд). Персональный таймер на id перезапускается, если тот же id
//     добавили снова.
//  2. Явная чистка на смену слайда Swipeable / уход со страницы (HomePage owns the
//     clear) — `clear()` гасит всё сразу И отменяет висячие таймеры.
//
// Таймеры живут в module-level реестре (вне zustand-стейта): их нельзя
// сериализовать, и `clear()` должен уметь их отменить, чтобы отложенный `remove`
// не сработал уже после ухода со страницы.
//
// Живёт в shared/model (а не в food-free-text-parse), потому что им пользуются
// оба виджета расписания — ровно как соседний itemTimesStore.

// Сколько секунд «недавняя» точка/flash-подсветка держится до авто-угасания.
const RECENT_TTL_MS = 5000;

const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

function cancelTimer(id: string): void {
  const timer = expiryTimers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    expiryTimers.delete(id);
  }
}

function cancelAllTimers(): void {
  for (const timer of expiryTimers.values()) clearTimeout(timer);
  expiryTimers.clear();
}

type State = {
  ids: Set<string>;
  addMany: (ids: string[]) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useRecentlyAddedStore = create<State>((set, get) => ({
  ids: new Set(),
  addMany: (newIds) => {
    if (newIds.length === 0) return;
    set((s) => {
      const next = new Set(s.ids);
      for (const id of newIds) next.add(id);
      return { ids: next };
    });
    // Персональный TTL на каждый id (перезапуск, если id пришёл повторно). Side
    // effect держим ВНЕ set-апдейтера — апдейтер чистый.
    for (const id of newIds) {
      cancelTimer(id);
      expiryTimers.set(
        id,
        setTimeout(() => {
          expiryTimers.delete(id);
          get().remove(id);
        }, RECENT_TTL_MS)
      );
    }
  },
  remove: (id) => {
    cancelTimer(id);
    set((s) => {
      if (!s.ids.has(id)) return s;
      const next = new Set(s.ids);
      next.delete(id);
      return { ids: next };
    });
  },
  clear: () => {
    cancelAllTimers();
    set((s) => (s.ids.size === 0 ? s : { ids: new Set() }));
  },
}));

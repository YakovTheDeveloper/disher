// Эфемерный «почтовый ящик» id только что добавленных рядов (еда, события,
// ингредиенты блюда, порции). Пишущий путь кладёт id (markAdded); ряд на маунте
// читает (isJustAdded) и потребляет (takeJustAdded) — один раз за свою жизнь.
//
// Событие, а не состояние: НЕТ реактивной подписки (zustand не нужен), НЕТ TTL-
// таймеров, НЕТ swipe-clear. Одноразовый flash сам гасит себя CSS-анимацией
// (forwards), а takeJustAdded() бьёт id при первом маунте ряда, чтобы повторный
// маунт (ре-рендер списка, StrictMode) не переиграл его. Раньше это был живой
// toggling-флаг с TTL и внешней чисткой — из него выводили mount-анимацию, и она
// сталкивалась со вторым mount-каскадом (entrance). Серия багов лечится здесь
// конструкцией: разовый ящик вместо живого флага.
//
// Живёт в shared/model (а не в food-free-text-parse), потому что им пользуются
// оба виджета расписания + блюдо + порции — ровно как соседний itemTimesStore.
const justAdded = new Set<string>();

// Backstop: id рядов, добавленных в даты/сущности, которые юзер потом не
// открывает (ряд не смонтировался → take не вызвался), не копятся вечно. Грубая
// FIFO-отсечка старейших сверх лимита — потерянный flash безвреден.
const CAP = 50;

/** Пометить id как «только что добавленные» (пишущий путь после успешной записи). */
export function markAdded(ids: string[]): void {
  if (ids.length === 0) return;
  for (const id of ids) justAdded.add(id);
  if (justAdded.size > CAP) {
    const extra = justAdded.size - CAP;
    let i = 0;
    for (const id of justAdded) {
      if (i++ >= extra) break;
      justAdded.delete(id);
    }
  }
}

/** Чистое чтение (для useState-инициализатора ряда на первом рендере). */
export function isJustAdded(id: string): boolean {
  return justAdded.has(id);
}

/** Потребление (сайд-эффект — только в useEffect, НЕ в рендере). */
export function takeJustAdded(id: string): void {
  justAdded.delete(id);
}

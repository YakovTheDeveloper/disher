// Полное русское название дня недели («среда») из строки даты расписания
// (`dd-MM-yyyy` — тот же формат, что парсит HomeTopBar). Нижний регистр —
// капитализация на стороне CSS (`text-transform: capitalize`), как в топбаре.
export function weekdayLongRu(ddMmYyyy: string): string {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(ddMmYyyy);
  if (!m) return '';
  const [, dd, mm, yyyy] = m;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date);
}

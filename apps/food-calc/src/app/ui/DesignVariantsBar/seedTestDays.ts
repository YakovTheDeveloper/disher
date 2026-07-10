// ---------------------------------------------------------------------------
// Dev-only seeder: заполняет 10 дней (1–10 июня 2026) реалистичной едой +
// симптомами, чтобы можно было прогнать «длительный анализ» на живых данных.
//
// Данные не случайны — в них ЗАПЕЧЁН сигнал, который анализу есть смысл найти:
// «молочные дни» (молоко/творог/сыр/сметана/йогурт) тянут за собой вздутие +
// головную боль + усталость (отложенный отклик — канон пищевой непереносимости
// молочки), а «чистые» дни идут контролем. День 7 — слабая доза молочки → слабый
// симптом (dose-response). Кофе со-встречается в тяжёлых днях как реалистичный
// конфаундер. Структура приёмов пищи — по русскому канону завтрак/обед/ужин
// (каша/яйца/творог + суп-второе + чай со сладким).
//
// Источники, на которых стоит имитация:
//   Russian meal structure — masterrussian.com/russianculture/meals.htm
//   Dairy → delayed headache/bloating — pmc.ncbi.nlm.nih.gov/articles/PMC11666651
//   Common food intolerances — healthline.com/nutrition/common-food-intolerances
// ---------------------------------------------------------------------------

import { db } from '@/shared/lib/dexie/schema';
import { catalog } from '@/shared/data/catalog';
import { addScheduleFood, removeScheduleFood } from '@/entities/schedule-food';
import { addScheduleEvent, removeScheduleEvents } from '@/entities/schedule-event';

type FoodItem = { name: string; qty: number; time: string };
type Symptom = { text: string; severity: number; time: string };
type DayPlan = { foods: FoodItem[]; symptoms: Symptom[] };

// Резолвим продукт каталога по имени: точное совпадение → префикс. Возвращаем id
// или null (тогда пункт пропускается + имя копится в missing для предупреждения).
const nameToId = new Map<string, string>();
for (const p of catalog) {
  if (p.name) nameToId.set(p.name.toLowerCase(), p.id);
}
const resolve = (name: string): string | null => {
  const key = name.toLowerCase();
  const exact = nameToId.get(key);
  if (exact) return exact;
  const pref = catalog.find((p) => p.name?.toLowerCase().startsWith(key));
  return pref?.id ?? null;
};

// Пресеты приёмов пищи (время фиксировано по русскому распорядку).
const T = { zavtrak: '08:00', perekus1: '11:00', obed: '14:00', perekus2: '17:00', uzhin: '19:30' };
const meal = (time: string, items: Array<[string, number]>): FoodItem[] =>
  items.map(([name, qty]) => ({ name, qty, time }));

// 10 дней. `dairy: heavy` дни несут вздутие+головную боль+усталость.
const DAYS: DayPlan[] = [
  // ─ День 1 (1 июня) — МОЛОЧНЫЙ ─
  {
    foods: [
      ...meal(T.zavtrak, [['овсянка', 60], ['молоко', 200], ['кофе', 200], ['хлеб', 40], ['масло сливочное', 10], ['сыр', 30]]),
      ...meal(T.perekus1, [['творог', 150], ['мёд', 15]]),
      ...meal(T.obed, [['курица', 150], ['картофель', 200], ['помидор', 100], ['хлеб', 40]]),
      ...meal(T.perekus2, [['йогурт', 150]]),
      ...meal(T.uzhin, [['гречка', 100], ['говядина', 120], ['сметана', 30], ['чай зелёный', 200]]),
    ],
    symptoms: [
      { text: 'Головная боль', severity: 6, time: '15:30' },
      { text: 'Усталость, разбитость', severity: 5, time: '16:00' },
      { text: 'Вздутие живота', severity: 7, time: '21:00' },
    ],
  },
  // ─ День 2 (2 июня) — чистый ─
  {
    foods: [
      ...meal(T.zavtrak, [['гречка', 80], ['яйцо', 100], ['хлеб', 40], ['чай зелёный', 200]]),
      ...meal(T.perekus1, [['банан', 120], ['миндаль', 30]]),
      ...meal(T.obed, [['лосось', 150], ['рис', 150], ['брокколи', 120], ['огурец', 80]]),
      ...meal(T.perekus2, [['яблоко', 150]]),
      ...meal(T.uzhin, [['индейка', 130], ['картофель', 180], ['помидор', 100], ['чай зелёный', 200]]),
    ],
    symptoms: [],
  },
  // ─ День 3 (3 июня) — МОЛОЧНЫЙ (сырники) ─
  {
    foods: [
      ...meal('08:30', [['творог', 200], ['яйцо', 50], ['сметана', 30], ['мёд', 15], ['кофе', 200]]),
      ...meal(T.perekus1, [['йогурт', 150], ['банан', 120]]),
      ...meal(T.obed, [['макароны', 150], ['сыр', 40], ['курица', 120], ['помидор', 100]]),
      ...meal(T.perekus2, [['молоко', 200], ['шоколад', 30]]),
      ...meal(T.uzhin, [['картофель', 200], ['говядина', 120], ['огурец', 80], ['хлеб', 40]]),
    ],
    symptoms: [
      { text: 'Головная боль', severity: 7, time: '16:00' },
      { text: 'Усталость, сонливость', severity: 6, time: '17:30' },
      { text: 'Вздутие живота', severity: 7, time: '20:30' },
    ],
  },
  // ─ День 4 (4 июня) — чистый ─
  {
    foods: [
      ...meal(T.zavtrak, [['овсянка', 60], ['яблоко', 150], ['чай зелёный', 200]]),
      ...meal(T.perekus1, [['грецкий орех', 30], ['апельсин', 150]]),
      ...meal(T.obed, [['курица', 150], ['гречка', 120], ['брокколи', 120], ['огурец', 80]]),
      ...meal(T.perekus2, [['банан', 120]]),
      ...meal(T.uzhin, [['лосось', 150], ['картофель', 180], ['помидор', 100], ['чай зелёный', 200]]),
    ],
    symptoms: [{ text: 'Лёгкая усталость к вечеру', severity: 3, time: '18:00' }],
  },
  // ─ День 5 (5 июня) — МОЛОЧНЫЙ + много кофе ─
  {
    foods: [
      ...meal(T.zavtrak, [['овсянка', 60], ['молоко', 200], ['кофе', 200], ['хлеб', 40], ['масло сливочное', 10], ['сыр', 30]]),
      ...meal(T.perekus1, [['кофе', 200], ['шоколад', 40]]),
      ...meal(T.obed, [['картофель', 200], ['курица', 150], ['сметана', 30], ['помидор', 100]]),
      ...meal(T.perekus2, [['творог', 150], ['мёд', 15]]),
      ...meal(T.uzhin, [['макароны', 150], ['сыр', 40], ['говядина', 100], ['чай зелёный', 200]]),
    ],
    symptoms: [
      { text: 'Головная боль', severity: 8, time: '15:00' },
      { text: 'Вздутие живота', severity: 6, time: '21:00' },
      { text: 'Тяжело заснуть', severity: 6, time: '23:30' },
    ],
  },
  // ─ День 6 (6 июня) — чистый ─
  {
    foods: [
      ...meal(T.zavtrak, [['гречка', 80], ['яйцо', 100], ['авокадо', 70], ['чай зелёный', 200]]),
      ...meal(T.perekus1, [['яблоко', 150], ['миндаль', 30]]),
      ...meal(T.obed, [['индейка', 150], ['рис', 150], ['брокколи', 120], ['огурец', 80]]),
      ...meal(T.perekus2, [['апельсин', 150]]),
      ...meal(T.uzhin, [['лосось', 150], ['картофель', 180], ['помидор', 100]]),
    ],
    symptoms: [],
  },
  // ─ День 7 (7 июня) — немного молочки (йогурт) → слабый симптом (dose-response) ─
  {
    foods: [
      ...meal(T.zavtrak, [['овсянка', 60], ['банан', 120], ['грецкий орех', 30], ['чай зелёный', 200]]),
      ...meal(T.perekus1, [['йогурт', 150]]),
      ...meal(T.obed, [['курица', 150], ['картофель', 200], ['помидор', 100], ['огурец', 80]]),
      ...meal(T.perekus2, [['яблоко', 150]]),
      ...meal(T.uzhin, [['гречка', 100], ['говядина', 120], ['брокколи', 120], ['чай зелёный', 200]]),
    ],
    symptoms: [{ text: 'Небольшое вздутие', severity: 3, time: '20:30' }],
  },
  // ─ День 8 (8 июня) — МОЛОЧНЫЙ (сырники) ─
  {
    foods: [
      ...meal('08:30', [['творог', 200], ['яйцо', 50], ['сметана', 40], ['мёд', 15], ['кофе', 200]]),
      ...meal(T.perekus1, [['молоко', 200], ['банан', 120]]),
      ...meal(T.obed, [['макароны', 150], ['сыр', 50], ['курица', 120], ['помидор', 100]]),
      ...meal(T.perekus2, [['йогурт', 150], ['шоколад', 30]]),
      ...meal(T.uzhin, [['картофель', 200], ['говядина', 120], ['сметана', 30], ['хлеб', 40]]),
    ],
    symptoms: [
      { text: 'Головная боль', severity: 7, time: '16:30' },
      { text: 'Усталость, тяжесть', severity: 6, time: '18:00' },
      { text: 'Сильное вздутие живота', severity: 8, time: '20:30' },
    ],
  },
  // ─ День 9 (9 июня) — чистый ─
  {
    foods: [
      ...meal(T.zavtrak, [['гречка', 80], ['яйцо', 100], ['авокадо', 70], ['чай зелёный', 200]]),
      ...meal(T.perekus1, [['апельсин', 150], ['миндаль', 30]]),
      ...meal(T.obed, [['лосось', 150], ['рис', 150], ['брокколи', 120], ['огурец', 80]]),
      ...meal(T.perekus2, [['яблоко', 150]]),
      ...meal(T.uzhin, [['индейка', 140], ['картофель', 180], ['помидор', 100]]),
    ],
    symptoms: [],
  },
  // ─ День 10 (10 июня) — МОЛОЧНЫЙ (замыкаем паттерн) ─
  {
    foods: [
      ...meal(T.zavtrak, [['овсянка', 60], ['молоко', 200], ['кофе', 200], ['хлеб', 40], ['сыр', 30], ['масло сливочное', 10]]),
      ...meal(T.perekus1, [['творог', 150], ['мёд', 15]]),
      ...meal(T.obed, [['курица', 150], ['картофель', 200], ['сметана', 30], ['помидор', 100]]),
      ...meal(T.perekus2, [['йогурт', 150]]),
      ...meal(T.uzhin, [['макароны', 150], ['сыр', 40], ['говядина', 100], ['чай зелёный', 200]]),
    ],
    symptoms: [
      { text: 'Головная боль', severity: 6, time: '15:30' },
      { text: 'Усталость', severity: 5, time: '16:30' },
      { text: 'Вздутие живота', severity: 7, time: '21:00' },
    ],
  },
];

export type SeedResult = { days: number; foods: number; events: number; missing: string[] };

/** Засеять 10 дней (1–10 июня 2026). Идёт последовательно; повторный клик
 *  добавит дубли (dev-инструмент — очистка через сброс данных при нужде). */
export async function seedTestDays(): Promise<SeedResult> {
  const missing = new Set<string>();
  let foods = 0;
  let events = 0;

  // Идемпотентность: сносим ряды 1–10 июня перед вставкой — и по верному ключу
  // `dd-MM-yyyy`, и по ошибочному ISO `yyyy-MM-dd` (мусор с прошлой версии сидера),
  // чтобы повторный клик чистил дубли и осиротевшие ряды, а не плодил их.
  const purgeKeys = new Set<string>();
  for (let i = 1; i <= DAYS.length; i++) {
    const dd = String(i).padStart(2, '0');
    purgeKeys.add(`${dd}-06-2026`);
    purgeKeys.add(`2026-06-${dd}`);
  }
  const staleFoods = await db.schedule_foods
    .filter((r) => purgeKeys.has(r.date))
    .primaryKeys();
  for (const id of staleFoods) await removeScheduleFood(id as string);
  const staleEvents = await db.schedule_events
    .filter((r) => purgeKeys.has(r.date))
    .primaryKeys();
  await removeScheduleEvents(staleEvents as string[]);

  for (let i = 0; i < DAYS.length; i++) {
    // Ключ дня расписания — `dd-MM-yyyy` (см. router.tsx: /schedule/:date), НЕ
    // ISO `yyyy-MM-dd`. Ошибёшься форматом — ряды лягут под датой, которую экран
    // никогда не запрашивает (и long-анализ собирает дни тем же `dd-MM-yyyy`).
    const date = `${String(i + 1).padStart(2, '0')}-06-2026`;
    const plan = DAYS[i];

    for (const item of plan.foods) {
      const productId = resolve(item.name);
      if (!productId) {
        missing.add(item.name);
        continue;
      }
      await addScheduleFood({
        date,
        time: item.time,
        type: 'food',
        quantity: item.qty,
        productId,
      });
      foods++;
    }

    for (const sym of plan.symptoms) {
      await addScheduleEvent({
        date,
        time: sym.time,
        text: sym.text,
        atoms: [{ kind: 'scale', value: sym.severity }],
      });
      events++;
    }
  }

  return { days: DAYS.length, foods, events, missing: [...missing] };
}

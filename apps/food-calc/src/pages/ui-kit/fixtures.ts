// Fake props for the UI-Kit gallery. Pure data — NEVER written to Dexie.
//
// Why props, not a Dexie seed: the live Dexie holds the user's real rows and
// BackupGate would push any seeded fakes to their cloud vault. Widgets here
// take their data as props, so we feed fixtures directly. Secondary Dexie reads
// inside a widget (e.g. the nutrient-totals bar) degrade to zeros — fine for a
// visual review. Where a real entity id is required (ProductDrawer) we pass a
// read-only catalog id instead (catalog ships in the JS bundle).

import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import type { ScheduleEvent } from '@/entities/schedule-event';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import type { Portion } from '@/features/product/ProductQuantity';

/** A fixed schedule date so nothing depends on the wall clock. dd-MM-yyyy. */
export const DEMO_DATE = '19-06-2026';

// ─── Real read-only catalog ids (catalog.json ships in the bundle) ───────────
export const CATALOG = {
  apricot: { id: '4185', name: 'абрикос' },
  driedApricot: { id: 'sk-863', name: 'курага' },
  water: { id: 'sk-1070', name: 'вода' },
} as const;

// ─── Nutrient totals (keys per NutrientsBar: 1 Б · 2 Ж · 3 У · 6 Кл · 7 Ккал · 8 Вода) ──
export const DEMO_TOTALS: NutrientTotals = {
  '1': 86.4, // белки, г
  '2': 71.2, // жиры, г
  '3': 248.9, // углеводы, г
  '6': 27.5, // клетчатка, г
  '7': 2034, // ккал
  '8': 1450, // вода, г
};

// ─── Schedule-food rows (FoodSchedule / ScheduleFoodItem) ────────────────────
export const DEMO_SCHEDULE_FOODS: ScheduleFoodWithRelations[] = [
  {
    id: 'uikit-sf-1',
    date: DEMO_DATE,
    time: '08:30',
    type: 'food',
    quantity: 60,
    details: 'на молоке',
    productId: 'uikit-p-oat',
    dishId: null,
    createdAt: '2026-06-19T08:30:00.000Z',
    product: { name: 'овсянка', isUserCreated: false, servingUnit: null },
    dish: null,
  },
  {
    id: 'uikit-sf-2',
    date: DEMO_DATE,
    time: '08:30',
    type: 'food',
    quantity: 200,
    details: '',
    productId: CATALOG.water.id,
    dishId: null,
    createdAt: '2026-06-19T08:31:00.000Z',
    product: { name: 'вода', isUserCreated: false, servingUnit: null },
    dish: null,
  },
  {
    id: 'uikit-sf-3',
    date: DEMO_DATE,
    time: '13:15',
    type: 'dish',
    quantity: 320,
    details: 'половина порции',
    productId: null,
    dishId: 'uikit-d-1',
    createdAt: '2026-06-19T13:15:00.000Z',
    product: null,
    dish: { name: 'Овощное рагу с курицей' },
  },
  {
    id: 'uikit-sf-4',
    date: DEMO_DATE,
    time: '19:40',
    type: 'food',
    quantity: 2,
    details: 'мой продукт',
    productId: 'uikit-p-supp',
    dishId: null,
    createdAt: '2026-06-19T19:40:00.000Z',
    product: { name: 'омега-3', isUserCreated: true, servingUnit: 'капс' },
    dish: null,
  },
];

// ─── Schedule events (ScheduleEvents / ScheduleEventCard) ────────────────────
export const DEMO_EVENTS: ScheduleEvent[] = [
  {
    id: 'uikit-ev-1',
    date: DEMO_DATE,
    time: '07:15',
    endTime: '08:00',
    text: 'Утренняя пробежка',
    atoms: [
      { kind: 'scale', value: 7, label: 'Нагрузка' },
      { kind: 'tag', value: 'кардио' },
    ],
    createdAt: '2026-06-19T07:15:00.000Z',
  },
  {
    id: 'uikit-ev-2',
    date: DEMO_DATE,
    time: '15:00',
    endTime: '',
    text: 'Головная боль',
    atoms: [
      { kind: 'scale', value: 4, label: 'Сила' },
      { kind: 'relation', value: 'после обеда' },
    ],
    createdAt: '2026-06-19T15:00:00.000Z',
  },
  {
    id: 'uikit-ev-3',
    date: DEMO_DATE,
    time: '23:10',
    endTime: '',
    text: 'Сон',
    atoms: [],
    createdAt: '2026-06-19T23:10:00.000Z',
  },
];

// ─── FoodActionCard item objects (search result cards) ───────────────────────
// getTotalNutrients(qty) returns nutrient-id → amount; abricot per-100 values.
const APRICOT_PER_100: Record<string, number> = {
  '1': 0.93,
  '2': 0.25,
  '3': 9.6,
  '6': 1.81,
  '7': 44,
  '8': 87.05,
};
const scaleNutrients =
  (per100: Record<string, number>) =>
  (qty: number): Record<string, number> =>
    Object.fromEntries(Object.entries(per100).map(([k, v]) => [k, v * (qty / 100)]));

export const DEMO_FOOD_CARDS = {
  catalogProduct: {
    id: CATALOG.apricot.id,
    name: CATALOG.apricot.name,
    userId: null,
    categories: 'fruit',
    servingBasis: '100g' as const,
    getTotalNutrients: scaleNutrients(APRICOT_PER_100),
  },
  userProduct: {
    id: 'uikit-p-supp',
    name: 'омега-3',
    userId: 'me',
    categories: null,
    servingBasis: 'serving' as const,
    getTotalNutrients: scaleNutrients({ '2': 1.2, '7': 9 }),
  },
  dish: {
    id: 'uikit-d-1',
    name: 'Овощное рагу с курицей',
    userId: 'me',
    categories: null,
    servingBasis: '100g' as const,
    getTotalNutrients: scaleNutrients({ '1': 8.4, '2': 4.1, '3': 6.2, '7': 92 }),
  },
};

// ─── Portions (ProductQuantity / FoodPortionsManager) ────────────────────────
export const DEMO_PORTIONS: Portion[] = [
  { label: 'миска', grams: 250 },
  { label: 'стакан', grams: 200 },
  { label: 'столовая ложка', grams: 15 },
];

export const DEMO_IMPLICIT_PORTION: Portion = { label: 'Всё блюдо', grams: 640 };

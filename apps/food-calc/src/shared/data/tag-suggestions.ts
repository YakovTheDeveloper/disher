// Suggestion-chip vocabulary for the schedule_food `details` field.
//
// Per the plan (apps/food-calc/tds/prep-method-plan.md), `details` is a
// comma-separated string. Chips are a fast way to toggle commonly-used tags;
// the textarea is still there for free-form text. Suggestions are merged
// across all of a product's categories.
//
// Categories without an entry (spice, oil, coffee, condiment, alcohol,
// processed, snack, other) intentionally suppress the chip-row — only the
// textarea is shown. The user can still type anything, and the next time
// the same product is selected, those typed-in tags will appear as
// `custom_tags` chips for that specific productId.

export const TAG_SUGGESTIONS: Record<string, readonly string[]> = {
  meat:     ['варёное', 'жареное', 'запечённое', 'на гриле', 'тушёное', 'без масла', 'маринованное', 'копчёное'],
  poultry:  ['варёное', 'жареное', 'запечённое', 'на гриле', 'тушёное', 'без масла', 'без кожи'],
  fish:     ['варёное', 'жареное', 'запечённое', 'на гриле', 'тушёное', 'слабосолёное', 'копчёное', 'консервы'],
  seafood:  ['варёное', 'жареное', 'на гриле', 'тушёное', 'консервы'],
  egg:      ['варёное', 'всмятку', 'вкрутую', 'жареное', 'омлет', 'пашот'],

  dairy:    ['обезжиренное', 'жирное', 'натуральное', 'с сахаром', 'выдержанное', 'свежее', 'домашнее'],

  vegetable:['сырое', 'варёное', 'жареное', 'запечённое', 'на гриле', 'тушёное', 'квашеное', 'маринованное', 'с кожурой', 'без кожуры'],
  fruit:    ['свежее', 'спелое', 'зелёное', 'сушёное', 'замороженное', 'с кожурой', 'без кожуры'],
  legume:   ['варёное', 'тушёное', 'консервы', 'пророщенное'],
  grain:    ['варёное', 'на воде', 'на молоке', 'разваренное', 'аль денте'],
  nut:      ['сырое', 'жареное', 'солёное', 'без соли'],
  seed:     ['сырое', 'жареное', 'пророщенное'],

  bakery:   ['свежее', 'вчерашнее', 'подсушенное', 'белое', 'цельнозерновое', 'домашнее', 'магазинное'],
  dessert:  ['домашнее', 'магазинное', 'без сахара', 'с сахаром'],

  beverage: ['холодное', 'тёплое', 'газированное', 'без сахара', 'с сахаром', 'домашнее'],
  juice:    ['свежевыжатый', 'пакетированный', 'без сахара', 'с мякотью'],

  // Categories without an entry below intentionally suppress the chip-row.
  // Add them here if a pattern emerges — keeping it conservative for now.
};

/** Merge suggestion lists for all of a product's categories, deduped + sorted. */
export function getSuggestionsForProduct(categories: readonly string[]): string[] {
  if (!categories || categories.length === 0) return [];
  const merged = new Set<string>();
  for (const cat of categories) {
    const list = TAG_SUGGESTIONS[cat];
    if (list) for (const t of list) merged.add(t);
  }
  return [...merged].sort((a, b) => a.localeCompare(b, 'ru'));
}

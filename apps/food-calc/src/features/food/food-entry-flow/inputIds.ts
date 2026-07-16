// Единый namespace input-id для флоу создания/редактирования еды.
//
// Расписание (HomePage) и блюдо (DishPage) живут на разных роутах, НО во время
// перехода между страницами оба могут кратко сосуществовать в DOM (View
// Transitions) — поэтому id неймспейсятся по `kind`, чтобы `<label htmlFor>` не
// сфокусировал чужой инпут. Внутри ОДНОЙ страницы create+edit модалки
// смонтированы одновременно → у них РАЗНЫЕ id (create vs edit).
// `proposal-*` — правка ряда ПРЕДЛОЖКИ (in-memory строка разбора, не сущность
// Dexie). Свои id, потому что предложка живёт на том же экране, что create+edit
// сущности, и делит с ними DOM; хост (`schedule`/`dish`) остаётся в имени, чтобы
// переход между экранами (оба кратко в DOM) не столкнул два инстанса предложки.
export type FoodEntryKind = 'schedule' | 'dish' | 'proposal-schedule' | 'proposal-dish';

export type FoodEntryStepIds = {
  SEARCH_INPUT: string;
  QUANTITY_INPUT: string;
  DETAILS_INPUT: string;
  /** Только create. */
  CREATE_INPUT: string;
  /** Только edit (и только для расписания — у блюда нет шага «Время»). */
  TIME_INPUT: string;
  /** Только предложка — хаб-шаг «Что поправить?» (тап по имени+особенностям →
   *  чузер «Поменять еду» / «Поменять особенности»). */
  CHOOSE_INPUT: string;
};

export type FoodEntryMode = 'create' | 'edit';

export function foodEntryInputIds(
  kind: FoodEntryKind,
): Record<FoodEntryMode, FoodEntryStepIds> {
  return {
    create: {
      SEARCH_INPUT: `${kind}-fe-search`,
      QUANTITY_INPUT: `${kind}-fe-quantity`,
      DETAILS_INPUT: `${kind}-fe-details`,
      CREATE_INPUT: `${kind}-fe-create`,
      TIME_INPUT: `${kind}-fe-time`,
      CHOOSE_INPUT: `${kind}-fe-choose`,
    },
    edit: {
      SEARCH_INPUT: `${kind}-fe-edit-search`,
      QUANTITY_INPUT: `${kind}-fe-edit-quantity`,
      DETAILS_INPUT: `${kind}-fe-edit-details`,
      CREATE_INPUT: `${kind}-fe-edit-create`,
      TIME_INPUT: `${kind}-fe-edit-time`,
      CHOOSE_INPUT: `${kind}-fe-edit-choose`,
    },
  };
}

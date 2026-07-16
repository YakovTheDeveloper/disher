// Pure filter — превращает review-rows из useWriteFoodFlow в `CommittedItem[]`,
// которые `commit()` отдаёт в `addScheduleFood` / `addDishItem`. Вынесено в
// отдельный модуль, чтобы тесты импортировали один источник правды
// (раньше тесты копировали логику inline и не ловили дрейф условий, в
// частности новый `u.enabled` гейт для soft-delete на unresolved).
//
// Правила фильтра:
//   resolved   → r.enabled
//   ambiguous  → a.enabled && a.selectedId
//   unresolved → u.enabled && u.manual && u.manual.id

// Ручной выбор еды на ряду (юзер прошёл поиск из предложки). Перебивает то, что
// подобрал матчер, и — в отличие от него — может указывать на БЛЮДО.
export type RowChoice = {
  variant: 'product' | 'dish';
  productId: string | null;
  dishId: string | null;
  name: string;
} | null;

export interface CommittedItem {
  type: 'food' | 'dish';
  productId: string | null;
  dishId: string | null;
  quantity: number;
  time: string;
  details: string;
}

interface RowBase {
  enabled: boolean;
  choice?: RowChoice;
  quantity: number;
  time: string;
  details: string;
}

interface ResolvedFilterInput extends RowBase {
  productId: string;
}

interface AmbiguousFilterInput extends RowBase {
  selectedId: string | null;
}

interface UnresolvedFilterInput extends RowBase {
  manual: { id: string } | null;
}

// На что ряд ссылается ПОСЛЕ ручных правок: `choice` (если юзер выбирал еду сам)
// перебивает выбор матчера. `null` — ряд не на что коммитить (нераспознанный без
// подбора / уточнение без выбранного кандидата).
function effectiveRef(
  choice: RowChoice | undefined,
  matcherProductId: string | null,
): Omit<CommittedItem, 'quantity' | 'time' | 'details'> | null {
  if (choice) {
    if (choice.variant === 'dish') {
      return choice.dishId ? { type: 'dish', productId: null, dishId: choice.dishId } : null;
    }
    return choice.productId
      ? { type: 'food', productId: choice.productId, dishId: null }
      : null;
  }
  return matcherProductId ? { type: 'food', productId: matcherProductId, dishId: null } : null;
}

export interface SelectCommittableInput {
  resolved: ResolvedFilterInput[];
  ambiguous: AmbiguousFilterInput[];
  unresolved: UnresolvedFilterInput[];
}

// Сколько рядов юзер dismiss'нул (`enabled === false`) во всех трёх
// категориях вместе. Используется в telemetry как `itemsDeleted`.
// До 2026-05-24 эта величина считалась через `deletedCountRef` (только
// hard-delete из WriteFoodModal) и для soft-delete оставалась 0 — analytics
// показывала «0 удалено» когда юзер dismiss'нул половину предложки. Pure
// функция, чтобы unit-тест валидировал источник, а не его копию.
export function countDismissed(input: SelectCommittableInput): number {
  return (
    input.resolved.filter((r) => !r.enabled).length +
    input.ambiguous.filter((a) => !a.enabled).length +
    input.unresolved.filter((u) => !u.enabled).length
  );
}

// Сумма рядов во всех трёх категориях (включая dismissed). Используется
// в telemetry как `itemsTotal`.
export function countTotal(input: SelectCommittableInput): number {
  return input.resolved.length + input.ambiguous.length + input.unresolved.length;
}

export function selectCommittable(input: SelectCommittableInput): CommittedItem[] {
  const out: CommittedItem[] = [];

  const push = (row: RowBase, ref: ReturnType<typeof effectiveRef>) => {
    if (!row.enabled || !ref) return;
    out.push({ ...ref, quantity: row.quantity, time: row.time, details: row.details });
  };

  for (const r of input.resolved) push(r, effectiveRef(r.choice, r.productId));
  for (const a of input.ambiguous) push(a, effectiveRef(a.choice, a.selectedId));
  for (const u of input.unresolved) push(u, effectiveRef(u.choice, u.manual?.id ?? null));

  return out;
}

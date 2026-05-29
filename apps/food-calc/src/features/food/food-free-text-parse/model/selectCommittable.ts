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

export interface CommittedItem {
  productId: string;
  quantity: number;
  time: string;
  details: string;
}

interface ResolvedFilterInput {
  enabled: boolean;
  productId: string;
  quantity: number;
  time: string;
  details: string;
}

interface AmbiguousFilterInput {
  enabled: boolean;
  selectedId: string | null;
  quantity: number;
  time: string;
  details: string;
}

interface UnresolvedFilterInput {
  enabled: boolean;
  manual: { id: string } | null;
  quantity: number;
  time: string;
  details: string;
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

  for (const r of input.resolved) {
    if (!r.enabled) continue;
    out.push({
      productId: r.productId,
      quantity: r.quantity,
      time: r.time,
      details: r.details,
    });
  }

  for (const a of input.ambiguous) {
    if (!a.enabled || !a.selectedId) continue;
    out.push({
      productId: a.selectedId,
      quantity: a.quantity,
      time: a.time,
      details: a.details,
    });
  }

  for (const u of input.unresolved) {
    if (!u.enabled || !u.manual || !u.manual.id) continue;
    out.push({
      productId: u.manual.id,
      quantity: u.quantity,
      time: u.time,
      details: u.details,
    });
  }

  return out;
}

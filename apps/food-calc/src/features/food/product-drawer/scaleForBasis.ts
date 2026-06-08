// Коэффициент пересчёта нутриентов под выбранное количество.
//   '100g'    (еда)    → нутриенты на 100 г, скейл = quantity / 100
//   'serving' (добавка) → нутриенты на 1 единицу, скейл = quantity (доз)
export function scaleForBasis(basis: '100g' | 'serving', quantity: number): number {
  return basis === 'serving' ? quantity : quantity / 100;
}

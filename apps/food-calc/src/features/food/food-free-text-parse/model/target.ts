import { RouterUrls } from '@/app/router';

export type ParseTarget =
  | { kind: 'schedule'; date: string }
  | { kind: 'dish'; dishId: string };

export function getStorageKey(target: ParseTarget): string {
  if (target.kind === 'schedule') {
    return `freeTextFood:parseState:schedule:${target.date}`;
  }
  return `freeTextFood:parseState:dish:${target.dishId}`;
}

export function getReviewUrl(target: ParseTarget): string {
  if (target.kind === 'schedule') return RouterUrls.FreeTextFoodSchedule(target.date);
  return RouterUrls.FreeTextFoodDish(target.dishId);
}

export function targetId(target: ParseTarget): string {
  return target.kind === 'schedule' ? target.date : target.dishId;
}

export function getWriteFoodInputId(target: ParseTarget): string {
  return target.kind === 'schedule' ? 'write-food-input-schedule' : 'write-food-input-dish';
}

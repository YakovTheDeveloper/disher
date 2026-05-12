import type { DailyNormItems } from './types';
import { DEFAULT_NORM_ITEMS } from './default-norm';

export type Sex = 'male' | 'female';
export type Activity = 'low' | 'medium' | 'high';

export type NormSurvey = {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: Activity;
};

const ACTIVITY_FACTOR: Record<Activity, number> = {
  low: 1.375,
  medium: 1.55,
  high: 1.725,
};

const round = (v: number, step = 1) => Math.round(v / step) * step;

/** Mifflin-St Jeor — basal metabolic rate. */
export function calcBmr(s: Pick<NormSurvey, 'sex' | 'age' | 'weightKg' | 'heightCm'>): number {
  const base = 10 * s.weightKg + 6.25 * s.heightCm - 5 * s.age;
  return s.sex === 'male' ? base + 5 : base - 161;
}

/** Total daily energy expenditure (BMR × activity multiplier), maintenance goal. */
export function calcTdee(s: NormSurvey): number {
  return calcBmr(s) * ACTIVITY_FACTOR[s.activity];
}

export function generateNormFromSurvey(s: NormSurvey): DailyNormItems {
  const calories = Math.max(1200, calcTdee(s));

  const proteinPerKg = s.activity === 'high' ? 1.6 : 1.4;
  const protein = s.weightKg * proteinPerKg;

  const fat = s.weightKg * 1.0;
  const carbsKcal = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = carbsKcal / 4;

  const water = Math.max(1500, s.weightKg * 30);
  const fiber = calories < 2000 ? 25 : 30;

  // Sex/life-stage adjusted micros (DRI). Big gaps:
  //  iron — 18 mg (menstruating female) vs 8 mg (male / post-menopausal female ≈ proxy by age 50+)
  //  folate (B9), calcium, iodine — sex-neutral here; pregnancy/lactation not surveyed.
  const isMenstruating = s.sex === 'female' && s.age < 51;
  const iron = isMenstruating ? 18 : 8;
  const calcium = s.age >= 51 ? 1200 : 1000;
  const zinc = s.sex === 'male' ? 11 : 8;

  return {
    ...DEFAULT_NORM_ITEMS,
    '1': round(protein),
    '2': round(fat),
    '3': round(carbs),
    '6': fiber,
    '7': round(calories, 10),
    '8': round(water, 50),
    '9': iron,
    '12': calcium,
    '15': zinc,
  };
}

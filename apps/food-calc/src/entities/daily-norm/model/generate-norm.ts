import type { DailyNormItems } from './types';
import { DEFAULT_NORM_ITEMS } from './default-norm';

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
export type Goal = 'lose' | 'maintain' | 'gain' | 'health';

export type NormSurvey = {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
};

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// 'health' = maintenance for calories; semantic emphasis on quality lives in UI.
const GOAL_KCAL_FACTOR: Record<Goal, number> = {
  lose: 0.85,
  maintain: 1.0,
  health: 1.0,
  gain: 1.15,
};

const round = (v: number, step = 1) => Math.round(v / step) * step;

/** Mifflin-St Jeor — basal metabolic rate. */
export function calcBmr(s: Pick<NormSurvey, 'sex' | 'age' | 'weightKg' | 'heightCm'>): number {
  const base = 10 * s.weightKg + 6.25 * s.heightCm - 5 * s.age;
  return s.sex === 'male' ? base + 5 : base - 161;
}

/** Maintenance TDEE (BMR × activity), before goal adjustment. */
export function calcTdee(s: Pick<NormSurvey, 'sex' | 'age' | 'weightKg' | 'heightCm' | 'activity'>): number {
  return calcBmr(s) * ACTIVITY_FACTOR[s.activity];
}

/** Target calories for the goal — TDEE × goal-factor, floored at 1200. */
export function calcTargetKcal(s: NormSurvey): number {
  return Math.max(1200, calcTdee(s) * GOAL_KCAL_FACTOR[s.goal]);
}

export type Macros = {
  proteinG: number;
  fatG: number;
  carbsG: number;
  kcal: number;
};

/** Live-preview macros — protein/fat anchored to body weight, carbs fill the kcal gap. */
export function calcMacros(s: NormSurvey): Macros {
  const kcal = calcTargetKcal(s);

  // Higher protein for cut / gain / heavy training — preserves lean mass on deficit,
  // supports growth on surplus. Plain maintenance / health stays at baseline.
  const aggressive = s.activity === 'very_active' || s.activity === 'extra_active';
  const cuttingOrGaining = s.goal === 'lose' || s.goal === 'gain';
  const proteinPerKg = aggressive || cuttingOrGaining ? 1.6 : 1.4;

  const proteinG = s.weightKg * proteinPerKg;
  const fatG = s.weightKg * 1.0;
  const carbsKcal = Math.max(0, kcal - proteinG * 4 - fatG * 9);
  const carbsG = carbsKcal / 4;

  return {
    proteinG: round(proteinG),
    fatG: round(fatG),
    carbsG: round(carbsG),
    kcal: round(kcal, 10),
  };
}

export function generateNormFromSurvey(s: NormSurvey): DailyNormItems {
  const { proteinG, fatG, carbsG, kcal } = calcMacros(s);
  const isHealth = s.goal === 'health';

  // 'health' shifts quality defaults: more fiber + water, less sugar.
  // Calorie target equals maintenance — see GOAL_KCAL_FACTOR.
  const fiberBase = kcal < 2000 ? 25 : 30;
  const fiber = isHealth ? round(fiberBase * 1.2) : fiberBase;
  const waterBase = Math.max(1500, s.weightKg * 30);
  const water = isHealth ? waterBase + 500 : waterBase;
  const sugar = isHealth ? 35 : 50;

  // Sex/life-stage adjusted micros (DRI). Pregnancy/lactation not surveyed.
  const isMenstruating = s.sex === 'female' && s.age < 51;
  const iron = isMenstruating ? 18 : 8;
  const calcium = s.age >= 51 ? 1200 : 1000;
  const zinc = s.sex === 'male' ? 11 : 8;

  return {
    ...DEFAULT_NORM_ITEMS,
    '1': proteinG,
    '2': fatG,
    '3': carbsG,
    '4': sugar,
    '6': fiber,
    '7': kcal,
    '8': round(water, 50),
    '9': iron,
    '12': calcium,
    '15': zinc,
  };
}

import type { DailyNormItems } from './types';
import { DEFAULT_NORM } from './default-norm';

export type Sex = 'male' | 'female';
export type Activity = 'low' | 'medium' | 'high';
export type Goal = 'maintain' | 'lose' | 'gain';

export type NormSurvey = {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
};

const ACTIVITY_FACTOR: Record<Activity, number> = {
  low: 1.375,
  medium: 1.55,
  high: 1.725,
};

const GOAL_DELTA: Record<Goal, number> = {
  maintain: 0,
  lose: -400,
  gain: 400,
};

const round = (v: number, step = 1) => Math.round(v / step) * step;

export function generateNormFromSurvey(s: NormSurvey): DailyNormItems {
  const bmrBase = 10 * s.weightKg + 6.25 * s.heightCm - 5 * s.age;
  const bmr = s.sex === 'male' ? bmrBase + 5 : bmrBase - 161;
  const tdee = bmr * ACTIVITY_FACTOR[s.activity];
  const calories = Math.max(1200, tdee + GOAL_DELTA[s.goal]);

  const proteinPerKg = s.goal === 'lose' ? 1.8 : s.activity === 'high' ? 1.8 : 1.4;
  const protein = s.weightKg * proteinPerKg;

  const fatPerKg = 1.0;
  const fat = s.weightKg * fatPerKg;

  const carbsKcal = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = carbsKcal / 4;

  const water = Math.max(1500, s.weightKg * 30);
  const fiber = calories < 2000 ? 25 : 30;

  return {
    ...DEFAULT_NORM.items,
    '1': round(protein),
    '2': round(fat),
    '3': round(carbs),
    '6': fiber,
    '7': round(calories, 10),
    '8': round(water, 50),
  };
}

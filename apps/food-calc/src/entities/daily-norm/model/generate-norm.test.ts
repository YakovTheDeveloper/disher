import { describe, it, expect } from 'vitest';
import {
  calcTargetKcal,
  generateNormFromSurvey,
  type NormSurvey,
} from './generate-norm';

const base: NormSurvey = {
  sex: 'male',
  age: 30,
  weightKg: 70,
  heightCm: 175,
  activity: 'moderate',
  goal: 'maintain',
};

describe('calcTargetKcal — floor 1200', () => {
  it('floors at 1200 for extreme low (small sedentary female on cut)', () => {
    const kcal = calcTargetKcal({
      ...base,
      sex: 'female',
      age: 14,
      weightKg: 30,
      heightCm: 100,
      activity: 'sedentary',
      goal: 'lose',
    });
    expect(kcal).toBe(1200);
  });

  it('does not floor when normal TDEE exceeds 1200', () => {
    const kcal = calcTargetKcal(base);
    expect(kcal).toBeGreaterThan(1200);
  });
});

describe('generateNormFromSurvey — iron / calcium / zinc branches', () => {
  it('female age<51 → iron 18 (menstruating default)', () => {
    const items = generateNormFromSurvey({ ...base, sex: 'female', age: 30 });
    expect(items['9']).toBe(18);
  });

  it('female age≥51 → iron 8 (post-menopausal proxy)', () => {
    const items = generateNormFromSurvey({ ...base, sex: 'female', age: 55 });
    expect(items['9']).toBe(8);
  });

  it('male → iron 8 regardless of age', () => {
    expect(generateNormFromSurvey({ ...base, sex: 'male', age: 30 })['9']).toBe(8);
    expect(generateNormFromSurvey({ ...base, sex: 'male', age: 70 })['9']).toBe(8);
  });

  it('age≥51 bumps calcium to 1200, otherwise 1000', () => {
    expect(generateNormFromSurvey({ ...base, age: 30 })['12']).toBe(1000);
    expect(generateNormFromSurvey({ ...base, age: 55 })['12']).toBe(1200);
  });

  it('male → zinc 11, female → zinc 8', () => {
    expect(generateNormFromSurvey({ ...base, sex: 'male' })['15']).toBe(11);
    expect(generateNormFromSurvey({ ...base, sex: 'female' })['15']).toBe(8);
  });
});

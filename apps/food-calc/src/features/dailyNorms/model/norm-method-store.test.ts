import { describe, it, expect } from 'vitest';
import { showSurveyCommitButton, sameSurvey, DEFAULT_SURVEY } from './norm-method-store';

describe('showSurveyCommitButton — правило кнопка-vs-результат', () => {
  it('нормы ещё нет → кнопка (что бы ни было со снимком/способом)', () => {
    expect(
      showSurveyCommitButton({ surveyChanged: false, hasNorm: false, committedMethod: null }),
    ).toBe(true);
  });

  it('норма задана анкетой и не менялась → результат (кнопки нет)', () => {
    expect(
      showSurveyCommitButton({ surveyChanged: false, hasNorm: true, committedMethod: 'survey' }),
    ).toBe(false);
  });

  it('анкету поменяли → кнопка, даже при норме, заданной анкетой', () => {
    expect(
      showSurveyCommitButton({ surveyChanged: true, hasNorm: true, committedMethod: 'survey' }),
    ).toBe(true);
  });

  it('кросс-метод: норма задана ВРУЧНУЮ → на вкладке анкеты держим кнопку, не фиктивный результат', () => {
    // Регресс на баг: раньше committedMethod не учитывался → surveyChanged=false &
    // hasNorm=true давали «результат» из дефолт-анкеты (муж/30/70кг) и прятали кнопку.
    expect(
      showSurveyCommitButton({ surveyChanged: false, hasNorm: true, committedMethod: 'manual' }),
    ).toBe(true);
  });

  it('способ ещё не закоммичен (null) при наличии нормы → кнопка', () => {
    expect(
      showSurveyCommitButton({ surveyChanged: false, hasNorm: true, committedMethod: null }),
    ).toBe(true);
  });
});

describe('sameSurvey', () => {
  it('идентичные анкеты равны', () => {
    expect(sameSurvey(DEFAULT_SURVEY, { ...DEFAULT_SURVEY })).toBe(true);
  });

  it('различие в любом поле ломает равенство', () => {
    expect(sameSurvey(DEFAULT_SURVEY, { ...DEFAULT_SURVEY, weightKg: 71 })).toBe(false);
    expect(sameSurvey(DEFAULT_SURVEY, { ...DEFAULT_SURVEY, goal: 'lose' })).toBe(false);
  });
});

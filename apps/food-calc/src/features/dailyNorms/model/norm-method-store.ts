import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { NormSurvey } from '@/entities/daily-norm';

// Дефолтная анкета — единый источник (был локальный дубль в CreateDailyNormModal).
export const DEFAULT_SURVEY: NormSurvey = {
  sex: 'male',
  age: 30,
  weightKg: 70,
  heightCm: 175,
  activity: 'moderate',
  goal: 'health',
};

export type NormMethod = 'survey' | 'manual';

export interface NormMethodState {
  /**
   * Способ, которым норма ЗАКОММИЧЕНА последний раз (`survey`/`manual`), — что
   * реально задало сохранённую норму. `null` — норму ещё не задавали. Пишется
   * ТОЛЬКО на коммите тела (setMethod в handleCommit/handleSave), НЕ на клике
   * вкладки: DailyNormModal держит активную вкладку локальным стейтом. Это
   * отличает «норму задали анкетой» от «открыли вкладку анкеты».
   */
  method: NormMethod | null;
  /**
   * Снимок ПОСЛЕДНЕЙ закоммиченной анкеты. Живёт ТОЛЬКО на фронте (на бек уходит
   * лишь готовый объект нормы). Нужен, чтобы отличить «анкету поменяли» от «норма
   * стоит как была»: survey-тело сравнивает своё рабочее состояние с этим снимком.
   */
  survey: NormSurvey;
  setMethod: (method: NormMethod) => void;
  /** Зафиксировать анкету как закоммиченную (вызывается после upsertUserNorm). */
  commitSurvey: (survey: NormSurvey) => void;
}

// Same idb-keyval-backed Zustand persist pattern as the entity drafts
// (product/dish `model/draft.ts`) — front-only, wiped on sign-out by idb clear.
const idbStorage = {
  getItem: async (name: string) => {
    const v = await idbGet(name);
    return (v as string | undefined) ?? null;
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await idbDel(name);
  },
};

export const useNormMethodStore = create<NormMethodState>()(
  persist(
    (set) => ({
      method: null,
      survey: { ...DEFAULT_SURVEY },
      setMethod: (method) => set({ method }),
      commitSurvey: (survey) => set({ survey }),
    }),
    {
      name: 'norm-method',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

/**
 * Правило «кнопка-vs-результат» survey-тела нормы (CreateDailyNormModal): показать
 * кнопку подтверждения, если анкету поменяли ОТНОСИТЕЛЬНО закоммиченного снимка
 * ИЛИ нормы ещё нет ИЛИ норму задали НЕ анкетой (`committedMethod !== 'survey'`).
 * Последнее — суть фикса кросс-метода: при норме, заданной вручную, survey-снимок =
 * дефолт, поэтому колонка-«результат» показала бы фиктивные числа (муж/30/70кг), а
 * кнопка была бы недоступна. Иначе (норма задана анкетой и не менялась) — результат.
 */
export function showSurveyCommitButton(args: {
  surveyChanged: boolean;
  hasNorm: boolean;
  committedMethod: NormMethod | null;
}): boolean {
  return args.surveyChanged || !args.hasNorm || args.committedMethod !== 'survey';
}

/** Поверхностное равенство двух анкет (все 6 полей) — «анкету не меняли». */
export function sameSurvey(a: NormSurvey, b: NormSurvey): boolean {
  return (
    a.sex === b.sex &&
    a.age === b.age &&
    a.weightKg === b.weightKg &&
    a.heightCm === b.heightCm &&
    a.activity === b.activity &&
    a.goal === b.goal
  );
}

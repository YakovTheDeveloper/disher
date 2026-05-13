import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { type BaseModalProps } from '@/shared/ui';
import {
  upsertUserNorm,
  generateNormFromSurvey,
  calcMacros,
  calcTdee,
  type NormSurvey,
  type Activity,
  type Goal,
} from '@/entities/daily-norm';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import styles from './CreateDailyNormModal.module.scss';

// chrome:
//   'modal' (default) — full modal with ModalLayout, hero kicker+title header
//                       and the top-right × button.
//   'panel' — inline content for a drawer that already provides its own header
//             with back-button. Skips ModalLayout, hero header, Cancel button.
type Props = BaseModalProps & {
  chrome?: 'modal' | 'panel';
};

const DEFAULT_SURVEY: NormSurvey = {
  sex: 'male',
  age: 30,
  weightKg: 70,
  heightCm: 175,
  activity: 'moderate',
  goal: 'maintain',
};

const ACTIVITY_OPTIONS: Array<{ value: Activity; label: string; hint: string }> = [
  { value: 'sedentary', label: 'Сидячий', hint: 'офис, без спорта' },
  { value: 'light', label: 'Лёгкий', hint: '1–2 трен/нед, прогулки' },
  { value: 'moderate', label: 'Умеренный', hint: '3–5 трен/нед' },
  { value: 'very_active', label: 'Высокий', hint: '6–7 трен/нед' },
  { value: 'extra_active', label: 'Очень высокий', hint: 'спорт + физ. работа' },
];

const GOAL_OPTIONS: Array<{ value: Goal; label: string; hint: string }> = [
  { value: 'lose', label: 'Худеть', hint: '−15% от поддержания' },
  { value: 'maintain', label: 'Поддерживать', hint: 'текущий вес' },
  { value: 'gain', label: 'Набирать', hint: '+15% к поддержанию' },
  { value: 'health', label: 'Улучшить рацион', hint: 'поддержание + акцент на качестве' },
];

const LIMITS = {
  age: { min: 14, max: 100 },
  weightKg: { min: 30, max: 250 },
  heightCm: { min: 100, max: 230 },
} as const;

const clampToLimits = (s: NormSurvey): NormSurvey => ({
  ...s,
  age: clamp(s.age, LIMITS.age.min, LIMITS.age.max),
  weightKg: clamp(s.weightKg, LIMITS.weightKg.min, LIMITS.weightKg.max),
  heightCm: clamp(s.heightCm, LIMITS.heightCm.min, LIMITS.heightCm.max),
});

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

const fmt = (v: number) => v.toLocaleString('ru-RU');

const isInRange = (v: number, range: { min: number; max: number }) =>
  Number.isFinite(v) && v >= range.min && v <= range.max;

const CreateDailyNormModal = ({ onClose, chrome = 'modal' }: Props) => {
  const [survey, setSurvey] = useState<NormSurvey>(DEFAULT_SURVEY);

  // Preview is computed from clamped snapshot — state stays as user typed so
  // they can freely backspace a digit without the value jumping to min.
  const safeSurvey = useMemo(() => clampToLimits(survey), [survey]);

  const isValid = useMemo(
    () =>
      isInRange(survey.age, LIMITS.age) &&
      isInRange(survey.weightKg, LIMITS.weightKg) &&
      isInRange(survey.heightCm, LIMITS.heightCm),
    [survey],
  );

  const { bmr, tdee, macros } = useMemo(
    () => ({
      bmr: Math.round(
        (10 * safeSurvey.weightKg + 6.25 * safeSurvey.heightCm - 5 * safeSurvey.age +
          (safeSurvey.sex === 'male' ? 5 : -161)) / 5,
      ) * 5,
      tdee: Math.round(calcTdee(safeSurvey) / 10) * 10,
      macros: calcMacros(safeSurvey),
    }),
    [safeSurvey],
  );

  const patch = useCallback(
    (p: Partial<NormSurvey>) => setSurvey((prev) => ({ ...prev, ...p })),
    [],
  );

  const handleCommit = useCallback(async () => {
    if (!isValid) {
      toaster.error('Возраст 14–100, вес 30–250 кг, рост 100–230 см');
      return;
    }
    const items = generateNormFromSurvey(safeSurvey);
    const result = await safeMutate(
      () => upsertUserNorm(items),
      'Не удалось сохранить норму',
    );
    if (!result.ok) return;
    toaster.success('Норма подобрана');
    onClose();
  }, [safeSurvey, onClose, isValid]);

  const isPanel = chrome === 'panel';

  const content = (
    <div className={clsx(styles.root, isPanel && styles.rootPanel)}>
      {!isPanel && (
        <header className={styles.header}>
          <button
            type="button"
            className={styles.closeIcon}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
          <span className={styles.kicker}>Дневная норма</span>
          <h2 className={styles.title}>Моя норма</h2>
          <p className={styles.subtitle}>
            Несколько ответов — и калории, БЖУ, основные микроэлементы посчитаются
            по формуле Mifflin-St Jeor. Точные числа можно поправить руками позже.
          </p>
        </header>
      )}
      {isPanel && (
        <p className={styles.panelSubtitle}>
          Несколько ответов — и калории, БЖУ, основные микроэлементы посчитаются
          по формуле Mifflin-St Jeor. Точные числа можно поправить руками позже.
        </p>
      )}

        <div className={styles.body}>
          <Section label="Пол" hint="нужен только для формулы калорий">
            <div className={styles.pillRow}>
              <Pill active={survey.sex === 'male'} onClick={() => patch({ sex: 'male' })}>
                Мужской
              </Pill>
              <Pill active={survey.sex === 'female'} onClick={() => patch({ sex: 'female' })}>
                Женский
              </Pill>
            </div>
          </Section>

          <Section label="Возраст · Вес · Рост" hint="14–100 · 30–250 кг · 100–230 см">
            <div className={styles.numbersRow}>
              <NumberField
                label="возраст"
                unit="лет"
                value={survey.age}
                min={LIMITS.age.min}
                max={LIMITS.age.max}
                onChange={(v) => patch({ age: v })}
              />
              <NumberField
                label="вес"
                unit="кг"
                value={survey.weightKg}
                min={LIMITS.weightKg.min}
                max={LIMITS.weightKg.max}
                onChange={(v) => patch({ weightKg: v })}
              />
              <NumberField
                label="рост"
                unit="см"
                value={survey.heightCm}
                min={LIMITS.heightCm.min}
                max={LIMITS.heightCm.max}
                onChange={(v) => patch({ heightCm: v })}
              />
            </div>
          </Section>

          <Section label="Активность" hint="дневная, не только спорт">
            <div className={clsx(styles.pillRow, styles.pillRowWrap)}>
              {ACTIVITY_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  active={survey.activity === o.value}
                  onClick={() => patch({ activity: o.value })}
                  stacked
                >
                  <span className={styles.pillTitle}>{o.label}</span>
                  <span className={styles.pillHint}>{o.hint}</span>
                </Pill>
              ))}
            </div>
          </Section>

          <Section label="Цель">
            <div className={clsx(styles.pillRow, styles.pillRowWrap)}>
              {GOAL_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  active={survey.goal === o.value}
                  onClick={() => patch({ goal: o.value })}
                  stacked
                >
                  <span className={styles.pillTitle}>{o.label}</span>
                  <span className={styles.pillHint}>{o.hint}</span>
                </Pill>
              ))}
            </div>
          </Section>

          <div className={styles.preview}>
            <div className={styles.previewKcal}>
              <span className={styles.previewKcalValue}>{fmt(macros.kcal)}</span>
              <span className={styles.previewKcalUnit}>ккал в день</span>
            </div>
            <div className={styles.macros}>
              <MacroChip label="Б" value={macros.proteinG} />
              <MacroChip label="Ж" value={macros.fatG} />
              <MacroChip label="У" value={macros.carbsG} />
            </div>
            <p className={styles.previewMeta}>
              BMR ~{fmt(bmr)} · поддержание ~{fmt(tdee)} ккал
            </p>
            <p className={styles.disclaimer}>
              Это ориентир, не медицинская рекомендация. Disher — про корреляции
              «что съел / как себя чувствую», не про точный калькулятор.
            </p>
          </div>
        </div>

        <footer className={clsx(styles.footer, isPanel && styles.footerPanel)}>
          {!isPanel && (
            <button className={styles.cancelBtn} onClick={onClose} type="button">
              Отмена
            </button>
          )}
          <button
            className={clsx(styles.commitBtn, !isValid && styles.commitBtnInactive)}
            onClick={handleCommit}
            type="button"
            aria-disabled={!isValid}
          >
            Готово
          </button>
        </footer>
      </div>
  );

  return isPanel ? content : <ModalLayout>{content}</ModalLayout>;
};

type SectionProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

const Section = ({ label, hint, children }: SectionProps) => (
  <section className={styles.section}>
    <div className={styles.sectionHead}>
      <span className={styles.sectionLabel}>{label}</span>
      {hint && <span className={styles.sectionHint}>{hint}</span>}
    </div>
    {children}
  </section>
);

type PillProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  stacked?: boolean;
};

const Pill = ({ active, onClick, children, stacked }: PillProps) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      styles.pill,
      active && styles.pillActive,
      stacked && styles.pillStacked,
    )}
  >
    {children}
  </button>
);

type NumberFieldProps = {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
};

const NumberField = ({ label, unit, value, min, max, onChange }: NumberFieldProps) => {
  const invalid = !isInRange(value, { min, max });
  return (
    <label className={clsx(styles.numberField, invalid && styles.numberFieldInvalid)}>
      <span className={styles.numberLabel}>{label}</span>
      <div className={styles.numberInputRow}>
        <NumberInput value={value} onChange={onChange} maxLength={3} />
        <span className={styles.numberUnit}>{unit}</span>
      </div>
    </label>
  );
};

type MacroChipProps = {
  label: string;
  value: number;
};

const MacroChip = ({ label, value }: MacroChipProps) => (
  <div className={styles.macroChip}>
    <span className={styles.macroLabel}>{label}</span>
    <span className={styles.macroValue}>{fmt(value)}</span>
    <span className={styles.macroUnit}>г</span>
  </div>
);

export default CreateDailyNormModal;

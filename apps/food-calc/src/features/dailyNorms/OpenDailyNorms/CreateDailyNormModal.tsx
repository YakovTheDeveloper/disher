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
import { useFieldError } from '@/shared/ui/form/useFieldError';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { FieldLabel } from '@/shared/ui/atoms/Typography/FieldLabel';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
import styles from './CreateDailyNormModal.module.scss';
import { Heading, Text, Numeral, QuietLabel } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';

// chrome:
//   'modal' (default) — full modal with ModalLayout, hero title header
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
  goal: 'health',
};

const ACTIVITY_OPTIONS: Array<{ value: Activity; label: string; hint: string }> = [
  { value: 'sedentary', label: 'Сидячий', hint: 'офис, без спорта' },
  { value: 'light', label: 'Лёгкий', hint: '1–2 трен/нед, прогулки' },
  { value: 'moderate', label: 'Умеренный', hint: '3–5 трен/нед' },
  { value: 'very_active', label: 'Высокий', hint: '6–7 трен/нед' },
  { value: 'extra_active', label: 'Очень высокий', hint: 'спорт + физ. работа' },
];

// 'maintain' и 'health' слиты в одну цель: обе держат калории на поддержании,
// разница была только в скрытых микро (клетчатка/вода/сахар), которую превью
// не показывало → отдельная «Поддерживать» читалась как дубль «Улучшить рацион».
// Оставляем один пункт с value 'health' (поддержание калорий + качественные микро).
const GOAL_OPTIONS: Array<{ value: Goal; label: string; hint: string }> = [
  { value: 'lose', label: 'Худеть', hint: '−15% от поддержания' },
  { value: 'health', label: 'Улучшить рацион (поддержание)', hint: 'держим вес + акцент на качестве' },
  { value: 'gain', label: 'Набирать', hint: '+15% к поддержанию' },
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
            className={styles.backButton}
            onClick={onClose}
            aria-label="Назад"
          >
            <ArrowLeftIcon />
          </button>
          <Heading role="title" className={styles.title}>Моя норма</Heading>
          <Text as="p" role="caption" className={styles.subtitle}>
            Несколько ответов — и калории, БЖУ, основные микроэлементы посчитаются
            по формуле Mifflin-St Jeor. Точные числа можно поправить руками позже.
          </Text>
        </header>
      )}
      {isPanel && (
        <Text as="p" role="caption" className={styles.panelSubtitle}>
          Несколько ответов — и калории, БЖУ, основные микроэлементы посчитаются
          по формуле Mifflin-St Jeor. Точные числа можно поправить руками позже.
        </Text>
      )}

        <div className={clsx(styles.body, isPanel && styles.bodyPanel)}>
          <Section label="Пол">
            <ChoiceGroup
              className={styles.pillRow}
              aria-label="Пол"
              value={survey.sex}
              onChange={(v) => patch({ sex: v as NormSurvey['sex'] })}
            >
              <ChoiceItem className={styles.choiceCell} value="male">
                Мужской
              </ChoiceItem>
              <ChoiceItem className={styles.choiceCell} value="female">
                Женский
              </ChoiceItem>
            </ChoiceGroup>
          </Section>

          <Section label="Возраст · Вес · Рост">
            <div className={styles.numbersRow}>
              <NumberField
                unit="лет"
                value={survey.age}
                min={LIMITS.age.min}
                max={LIMITS.age.max}
                onChange={(v) => patch({ age: v })}
              />
              <NumberField
                unit="кг"
                value={survey.weightKg}
                min={LIMITS.weightKg.min}
                max={LIMITS.weightKg.max}
                onChange={(v) => patch({ weightKg: v })}
              />
              <NumberField
                unit="см"
                value={survey.heightCm}
                min={LIMITS.heightCm.min}
                max={LIMITS.heightCm.max}
                onChange={(v) => patch({ heightCm: v })}
              />
            </div>
          </Section>

          <Section label="Активность">
            <ChoiceGroup
              className={styles.pillCol}
              orientation="vertical"
              aria-label="Активность"
              value={survey.activity}
              onChange={(v) => patch({ activity: v as Activity })}
            >
              {ACTIVITY_OPTIONS.map((o) => (
                <ChoiceItem key={o.value} className={styles.choiceCellFull} value={o.value} stacked>
                  <Text as="span" role="label" className={styles.pillTitle}>{o.label}</Text>
                  <Text as="span" role="caption" className={styles.pillHint}>{o.hint}</Text>
                </ChoiceItem>
              ))}
            </ChoiceGroup>
          </Section>

          <Section label="Цель">
            <ChoiceGroup
              className={styles.pillCol}
              orientation="vertical"
              aria-label="Цель"
              value={survey.goal}
              onChange={(v) => patch({ goal: v as Goal })}
            >
              {GOAL_OPTIONS.map((o) => (
                <ChoiceItem key={o.value} className={styles.choiceCellFull} value={o.value} stacked>
                  <Text as="span" role="label" className={styles.pillTitle}>{o.label}</Text>
                  <Text as="span" role="caption" className={styles.pillHint}>{o.hint}</Text>
                </ChoiceItem>
              ))}
            </ChoiceGroup>
          </Section>

          <div className={styles.preview}>
            <div className={styles.previewKcal}>
              <Numeral as="span" size="hero" weight="medium" className={styles.previewKcalValue}>{fmt(macros.kcal)}</Numeral>
              <Text as="span" role="caption" className={styles.previewKcalUnit}>ккал в день</Text>
            </div>
            <div className={styles.macros}>
              <MacroChip label="Б" value={macros.proteinG} />
              <MacroChip label="Ж" value={macros.fatG} />
              <MacroChip label="У" value={macros.carbsG} />
            </div>
            <Text as="p" role="caption" className={styles.previewMeta}>
              BMR ~{fmt(bmr)} · поддержание ~{fmt(tdee)} ккал
            </Text>
            <Text as="p" role="caption" className={styles.disclaimer}>
              Это ориентир, не медицинская рекомендация. Disher — про корреляции
              «что съел / как себя чувствую», не про точный калькулятор.
            </Text>
          </div>
        </div>

        <footer className={clsx(styles.footer, isPanel && styles.footerPanel)}>
          <Button
            variant="system"
            fullWidth
            disabled={!isValid}
            onClick={handleCommit}
          >
            Готово
          </Button>
        </footer>
      </div>
  );

  return isPanel ? content : <ModalLayout>{content}</ModalLayout>;
};

type SectionProps = {
  label: string;
  children: React.ReactNode;
};

const Section = ({ label, children }: SectionProps) => (
  <section className={styles.section}>
    <div className={styles.sectionHead}>
      <FieldLabel>{label}</FieldLabel>
    </div>
    {children}
  </section>
);

type NumberFieldProps = {
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
};

const NumberField = ({ unit, value, min, max, onChange }: NumberFieldProps) => {
  // Inline a11y harness (no RHF/Zod) — the field owns its own aria wiring via
  // NumberInput's `error` prop; useFieldError just holds the message + a stable
  // clear so a corrected value stops announcing.
  const { error, setError, clear } = useFieldError();
  const invalid = !!error || !isInRange(value, { min, max });

  const handleChange = (v: number) => {
    onChange(v);
    // Non-negative + range check, evaluated inline on every keystroke.
    if (v < 0 || !isInRange(v, { min, max })) setError(`Допустимо ${min}–${max}`);
    else clear();
  };

  return (
    <label className={clsx(styles.numberField, invalid && styles.numberFieldInvalid)}>
      <div className={styles.numberInputRow}>
        <NumberInput value={value} onChange={handleChange} maxLength={3} error={error} />
        <Text as="span" role="caption" className={styles.numberUnit}>{unit}</Text>
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
    <QuietLabel as="span" className={styles.macroLabel}>{label}</QuietLabel>
    <Numeral as="span" size="base" weight="semibold" className={styles.macroValue}>{fmt(value)}</Numeral>
    <Text as="span" role="caption" className={styles.macroUnit}>г</Text>
  </div>
);

export default CreateDailyNormModal;

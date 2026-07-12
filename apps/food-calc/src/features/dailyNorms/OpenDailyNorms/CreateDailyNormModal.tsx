import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
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
import { FormLayout } from '@/shared/ui/form/FormLayout';
import { NutrientTotalsColumn } from '@/shared/ui/NutrientTotalsColumn';
import styles from './CreateDailyNormModal.module.scss';
import { Text, Heading } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';

// Explanatory copy under the «Моя норма» title — shared verbatim by both chrome
// modes (modal: first body line; panel: compact subtitle).
const EXPLAINER =
  'Несколько ответов — и калории, БЖУ, основные микроэлементы посчитаются ' +
  'по формуле Mifflin-St Jeor. Точные числа можно поправить руками позже.';

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
  {
    value: 'health',
    label: 'Улучшить рацион (поддержание)',
    hint: 'держим вес + акцент на качестве',
  },
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

// Значения сводки — как в NutrientsBar: голое округлённое целое (без разрядного
// разделителя), чтобы облик итога совпадал с дневной сводкой на «Рационе».
const fmtInt = (v: number) => String(Math.round(v));

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
    [survey]
  );

  const { bmr, tdee, macros } = useMemo(
    () => ({
      bmr:
        Math.round(
          (10 * safeSurvey.weightKg +
            6.25 * safeSurvey.heightCm -
            5 * safeSurvey.age +
            (safeSurvey.sex === 'male' ? 5 : -161)) /
            5
        ) * 5,
      tdee: Math.round(calcTdee(safeSurvey) / 10) * 10,
      macros: calcMacros(safeSurvey),
    }),
    [safeSurvey]
  );

  // Итоговая сводка переиспользует облик дневной сводки нутриентов (экран
  // «Рацион», NutrientsBar) через общий `NutrientTotalsColumn` — тот же набор
  // Б·Ж·У·Кл·Ккал·Вода. Клетчатка/вода живут только в полной норме, поэтому
  // считаем её здесь (макросы дают лишь Б/Ж/У/ккал).
  const summaryCells = useMemo(() => {
    const norm = generateNormFromSurvey(safeSurvey);
    return [
      { key: 'b', label: 'Б', value: fmtInt(macros.proteinG) },
      { key: 'f', label: 'Ж', value: fmtInt(macros.fatG) },
      { key: 'c', label: 'У', value: fmtInt(macros.carbsG) },
      { key: 'fiber', label: 'Кл', value: fmtInt(norm['6']) },
      { key: 'kcal', label: 'Ккал', value: fmtInt(macros.kcal) },
      { key: 'water', label: 'Вода', value: fmtInt(norm['8']) },
    ];
  }, [safeSurvey, macros]);

  const patch = useCallback(
    (p: Partial<NormSurvey>) => setSurvey((prev) => ({ ...prev, ...p })),
    []
  );

  const handleCommit = useCallback(async () => {
    if (!isValid) {
      toaster.error('Возраст 14–100, вес 30–250 кг, рост 100–230 см');
      return;
    }
    const items = generateNormFromSurvey(safeSurvey);
    const result = await safeMutate(() => upsertUserNorm(items), 'Не удалось сохранить норму');
    if (!result.ok) return;
    toaster.success('Норма подобрана');
    onClose();
  }, [safeSurvey, onClose, isValid]);

  const isPanel = chrome === 'panel';

  const commitButton = (
    <Button variant="system" fullWidth disabled={!isValid} onClick={handleCommit}>
      Готово
    </Button>
  );

  const formBody = (
    <>
      <FormLayout>
        <FormLayout.Caption>{EXPLAINER}</FormLayout.Caption>

        <FormLayout.Group label="Пол">
          <ChoiceGroup
            onSurface={2}
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
        </FormLayout.Group>

        <FormLayout.Group label="Возраст · Вес · Рост" direction="horizontal">
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
        </FormLayout.Group>

        <FormLayout.Group label="Активность">
          <ChoiceGroup
            className={styles.pillCol}
            orientation="vertical"
            onSurface={2}
            elevation="flat"
            aria-label="Активность"
            value={survey.activity}
            onChange={(v) => patch({ activity: v as Activity })}
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <ChoiceItem key={o.value} className={styles.choiceCellFull} value={o.value} stacked>
                <Text as="span" role="label" className={styles.pillTitle}>
                  {o.label}
                </Text>
                <Text as="span" role="caption" className={styles.pillHint}>
                  {o.hint}
                </Text>
              </ChoiceItem>
            ))}
          </ChoiceGroup>
        </FormLayout.Group>

        <FormLayout.Group label="Цель">
          <ChoiceGroup
            className={styles.pillCol}
            orientation="vertical"
            aria-label="Цель"
            onSurface={2}
            elevation="flat"
            value={survey.goal}
            onChange={(v) => patch({ goal: v as Goal })}
          >
            {GOAL_OPTIONS.map((o) => (
              <ChoiceItem key={o.value} className={styles.choiceCellFull} value={o.value} stacked>
                <Text as="span" role="label" className={styles.pillTitle}>
                  {o.label}
                </Text>
                <Text as="span" role="caption" className={styles.pillHint}>
                  {o.hint}
                </Text>
              </ChoiceItem>
            ))}
          </ChoiceGroup>
        </FormLayout.Group>

        {/* Итог — секция-ровня прочим группам формы (тот же section-gap, левый
            край). Заголовок несёт <Heading role="title"> (канон заголовка секции
            нутриентов), сводка — общий NutrientTotalsColumn (облик «Рациона»). */}
        <FormLayout.Group>
          <Heading role="headline" as="h3">
            Итог
          </Heading>
          {/* Две колонки: слева — выровненная сводка нутриентов, справа — тихая
              оговорка про точность + провенанс без жаргона (BMR → «без активности
              тратится», поддержание → «вес держится»). */}
          <div className={styles.summaryRow}>
            <NutrientTotalsColumn cells={summaryCells} align="start" />
            <div className={styles.previewMeta}>
              <Text as="p" role="caption" className={styles.previewMetaLine}>
                Примерная норма — точные числа можно поправить.
              </Text>
              <Text as="p" role="caption" className={styles.previewMetaLine}>
                Без активности тратится ~{fmt(bmr)} ккал, вес держится на ~{fmt(tdee)}
              </Text>
            </div>
          </div>
        </FormLayout.Group>
      </FormLayout>
    </>
  );

  // Panel mode — inline body inside a drawer that already owns header + scroll.
  // Интро теперь принадлежит форме (FormLayout.Caption), а actions — терминальный
  // «flow»-архетип общего shell-API (не hand-roll footer).
  if (isPanel) {
    return (
      <div className={clsx(styles.root, styles.rootPanel)}>
        <div className={clsx(styles.body, styles.bodyPanel)}>{formBody}</div>
        <ModalShell.ActionButtons placement="flow" right={commitButton} />
      </div>
    );
  }

  // Modal mode — canonical ModalShell chrome (header + body + keyboard-stick
  // ActionButtons). Интро — часть формы (FormLayout.Caption), больше не плоский
  // section-сосед Body.
  return (
    <ModalLayout a11yLabel="Моя норма">
      <ModalShell>
        <ModalShell.Header title="Моя норма" onBack={onClose} />
        <ModalShell.Body>
          {formBody}
          <ModalShell.Spacer />
          <ModalShell.ActionButtons debugId="daily-norm-create" right={commitButton} />
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

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
        <Text as="span" role="caption" className={styles.numberUnit}>
          {unit}
        </Text>
      </div>
    </label>
  );
};

export default CreateDailyNormModal;

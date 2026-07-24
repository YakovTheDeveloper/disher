import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { type BaseModalProps } from '@/shared/ui';
import {
  upsertUserNorm,
  generateNormFromSurvey,
  calcMacros,
  useHasUserNorm,
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
import { useNormMethodStore, sameSurvey, showSurveyCommitButton } from '@/features/dailyNorms/model';
import styles from './CreateDailyNormModal.module.scss';
import { Text } from '@/shared/ui/atoms/Typography';
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

// Значения сводки — как в NutrientsBar: голое округлённое целое (без разрядного
// разделителя), чтобы облик итога совпадал с дневной сводкой на «Рационе».
const fmtInt = (v: number) => String(Math.round(v));

const isInRange = (v: number, range: { min: number; max: number }) =>
  Number.isFinite(v) && v >= range.min && v <= range.max;

const CreateDailyNormModal = ({ onClose, chrome = 'modal' }: Props) => {
  const hasNorm = useHasUserNorm();
  const commitSurvey = useNormMethodStore((s) => s.commitSurvey);
  const setMethod = useNormMethodStore((s) => s.setMethod);
  // Способ, которым норма реально ЗАКОММИЧЕНА (persist пишется только на коммите
  // тела, не на клике вкладки) — отличает «норму задали анкетой» от «открыли
  // вкладку анкеты при норме, заданной вручную».
  const committedMethod = useNormMethodStore((s) => s.method);
  // Рабочее состояние засеиваем ПОСЛЕДНЕЙ закоммиченной анкетой (persist), чтобы
  // на входе `surveyChanged=false` и при заданной норме показался результат, а не
  // кнопка. Свежий стор = DEFAULT_SURVEY.
  const committedSurvey = useNormMethodStore((s) => s.survey);
  const [survey, setSurvey] = useState<NormSurvey>(
    () => useNormMethodStore.getState().survey
  );

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

  const macros = useMemo(() => calcMacros(safeSurvey), [safeSurvey]);

  // Правило кнопка-vs-результат: анкету поменяли (относительно закоммиченного
  // снимка) ИЛИ нормы ещё нет → кнопка подтверждения; норма есть и не менялась →
  // на месте кнопки тот же NutrientTotalsColumn (состояние «результат»).
  const surveyChanged = !sameSurvey(survey, committedSurvey);
  // Правило «кнопка-vs-результат» вынесено в чистую `showSurveyCommitButton`
  // (тестируется в norm-method-store.test): держим кнопку, если анкету меняли ИЛИ
  // нормы нет ИЛИ норму задали НЕ анкетой (иначе колонка показала бы фиктивные числа).
  const showButton = showSurveyCommitButton({ surveyChanged, hasNorm, committedMethod });

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
    // Фиксируем закоммиченную анкету (persist) — чтобы «результат/кнопка»
    // считались от неё — и помним способ для DailyNormModal.
    commitSurvey(safeSurvey);
    setMethod('survey');
    toaster.success('Норма подобрана');
    onClose();
  }, [safeSurvey, onClose, isValid, commitSurvey, setMethod]);

  const isPanel = chrome === 'panel';

  const commitButton = (
    <Button variant="system" fullWidth disabled={!isValid} onClick={handleCommit}>
      Установить норму
    </Button>
  );

  // Состояние «результат» — та же сводка, что была всегда-видимым «Итогом»,
  // теперь встаёт НА МЕСТО кнопки, когда норма задана и анкету не меняли.
  const resultColumn = <NutrientTotalsColumn cells={summaryCells} align="start" />;

  const formBody = (
    <>
      <FormLayout>
        <FormLayout.Caption>{EXPLAINER}</FormLayout.Caption>

        <FormLayout.Group label="Пол">
          <ChoiceGroup
            onSurface={0}
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
            onSurface={0}
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
            onSurface={0}
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

      </FormLayout>
    </>
  );

  // Panel mode — инлайн-тело внутри DailyNormModal, которая владеет header'ом и
  // скроллом. Интро принадлежит форме (FormLayout.Caption), а actions —
  // терминальный «flow»-архетип общего shell-API (не hand-roll footer).
  if (isPanel) {
    return (
      <div className={clsx(styles.root, styles.rootPanel)}>
        <div className={clsx(styles.body, styles.bodyPanel)}>{formBody}</div>
        {showButton ? (
          <ModalShell.ActionButtons placement="flow" right={commitButton} />
        ) : (
          <div className={styles.resultFooter}>{resultColumn}</div>
        )}
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
          {showButton ? (
            <>
              <ModalShell.Spacer />
              <ModalShell.ActionButtons debugId="daily-norm-create" right={commitButton} />
            </>
          ) : (
            <div className={styles.resultFooter}>{resultColumn}</div>
          )}
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

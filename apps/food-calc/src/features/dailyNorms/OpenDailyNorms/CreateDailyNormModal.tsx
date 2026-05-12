import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { type BaseModalProps } from '@/shared/ui';
import {
  upsertUserNorm,
  generateNormFromSurvey,
  calcBmr,
  calcTdee,
  type NormSurvey,
  type Sex,
  type Activity,
} from '@/entities/daily-norm';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';
import NutrientInput from '@/entities/nutrient/ui/NutrientCard/NutrientInput';
import { Ornament } from '@/shared/ui/Ornament';
import { Spacer } from '@/shared/ui/atoms/Spacer';
import styles from './CreateDailyNormModal.module.scss';

type Props = BaseModalProps;

type SurveyDraft = {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: Activity;
};

const DEFAULT_SURVEY: SurveyDraft = {
  sex: 'male',
  age: 30,
  weightKg: 70,
  heightCm: 175,
  activity: 'medium',
};

const ACTIVITY_OPTIONS: Array<{ value: Activity; label: string; hint: string }> = [
  { value: 'low', label: 'Низкая', hint: 'сидячий' },
  { value: 'medium', label: 'Средняя', hint: '3–5 тренировок' },
  { value: 'high', label: 'Высокая', hint: 'ежедневные' },
];

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v || min));

const CreateDailyNormModal = ({ onClose }: Props) => {
  const [survey, setSurvey] = useState<SurveyDraft>(DEFAULT_SURVEY);

  const { bmr, tdee } = useMemo(() => {
    const survey_: NormSurvey = survey;
    return {
      bmr: Math.round(calcBmr(survey_) / 5) * 5,
      tdee: Math.round(calcTdee(survey_) / 10) * 10,
    };
  }, [survey]);

  const patch = useCallback(
    (p: Partial<SurveyDraft>) => setSurvey((prev) => ({ ...prev, ...p })),
    [],
  );

  const handleCommit = useCallback(async () => {
    const items = generateNormFromSurvey(survey);
    const result = await safeMutate(
      () => upsertUserNorm(items),
      'Не удалось создать норму',
    );
    if (!result.ok) return;
    toaster.success('Норма подобрана');
    onClose();
  }, [survey, onClose]);

  return (
    <ModalLayout>
      <div className={styles.root}>
        <div className={styles.header}>
          <span className={styles.kicker}>Дневная норма</span>
          <span className={styles.title}>Моя норма</span>
          <p className={styles.subtitle}>
            Ответьте на несколько вопросов — рассчитаем калории, БЖУ и микроэлементы под вас.
          </p>
        </div>

        <div className={styles.body}>
          <Ornament text="пол" />
          <div className={styles.pillRow}>
            <PillButton active={survey.sex === 'male'} onClick={() => patch({ sex: 'male' })}>
              Мужской
            </PillButton>
            <PillButton active={survey.sex === 'female'} onClick={() => patch({ sex: 'female' })}>
              Женский
            </PillButton>
          </div>

          <div className={styles.numbersRow}>
            <NumberField
              label="возраст"
              value={survey.age}
              onChange={(v) => patch({ age: clamp(v, 10, 100) })}
              unit="лет"
            />
            <NumberField
              label="вес"
              value={survey.weightKg}
              onChange={(v) => patch({ weightKg: clamp(v, 30, 250) })}
              unit="кг"
            />
            <NumberField
              label="рост"
              value={survey.heightCm}
              onChange={(v) => patch({ heightCm: clamp(v, 100, 230) })}
              unit="см"
            />
          </div>

          <Ornament text="активность" />
          <div className={styles.pillRow}>
            {ACTIVITY_OPTIONS.map((o) => (
              <PillButton
                key={o.value}
                active={survey.activity === o.value}
                onClick={() => patch({ activity: o.value })}
              >
                <span className={styles.pillTitle}>{o.label}</span>
                <span className={styles.pillHint}>{o.hint}</span>
              </PillButton>
            ))}
          </div>

          <div className={styles.preview}>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>BMR</span>
              <span className={styles.previewValue}>~{bmr} <span className={styles.previewUnit}>ккал</span></span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>дневная норма</span>
              <span className={clsx(styles.previewValue, styles.previewValueStrong)}>
                ~{tdee} <span className={styles.previewUnit}>ккал</span>
              </span>
            </div>
            <p className={styles.previewHint}>
              Значения нутриентов потом можно править руками.
            </p>
          </div>

          <Spacer variant="screen-header-offset" />
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} type="button">
            Отмена
          </button>
          <button className={styles.commitBtn} onClick={handleCommit} type="button">
            Готово
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

type PillButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const PillButton = ({ active, onClick, children }: PillButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(styles.pill, active && styles.pillActive)}
  >
    {children}
  </button>
);

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
};

const NumberField = ({ label, value, onChange, unit }: NumberFieldProps) => (
  <div className={styles.numberField}>
    <span className={styles.numberLabel}>{label}</span>
    <NutrientInput value={value} onChange={onChange} unit={unit} />
  </div>
);

export default CreateDailyNormModal;

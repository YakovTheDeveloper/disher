import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import {
  createDailyNorm,
  generateNormFromSurvey,
  type NormSurvey,
  type Sex,
  type Activity,
  type Goal,
  type DailyNormItems,
} from '@/entities/daily-norm';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import NutrientInput from '@/entities/nutrient/ui/NutrientCard/NutrientInput';
import { Ornament } from '@/shared/ui/Ornament';
import { Spacer } from '@/shared/ui/atoms/Spacer';
import { NutrientCard } from '@/entities/nutrient/ui/NutrientCard';
import Nutrients from '@/entities/nutrient/ui/NutrientGroup/Nutrients';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import styles from './CreateDailyNormModal.module.scss';

export const CREATE_NORM_INPUT_ID = 'create-daily-norm-trigger';
const MANUAL_NAME_INPUT_ID = 'create-daily-norm-name';

type Props = {
  isExpanded: boolean;
  onClose: () => void;
};

type Step = 'choice' | 'manual' | 'survey' | 'preview';

type SurveyDraft = {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
};

const DEFAULT_SURVEY: SurveyDraft = {
  sex: 'male',
  age: 30,
  weightKg: 70,
  heightCm: 175,
  activity: 'medium',
  goal: 'maintain',
};

const ACTIVITY_OPTIONS: Array<{ value: Activity; label: string; hint: string }> = [
  { value: 'low', label: 'Низкая', hint: 'сидячий образ' },
  { value: 'medium', label: 'Средняя', hint: '3–5 тренировок' },
  { value: 'high', label: 'Высокая', hint: 'ежедневные' },
];

const GOAL_OPTIONS: Array<{ value: Goal; label: string }> = [
  { value: 'maintain', label: 'Поддержание' },
  { value: 'lose', label: 'Снижение веса' },
  { value: 'gain', label: 'Набор массы' },
];

const CreateDailyNormModal = ({ isExpanded, onClose }: Props) => {
  const [step, setStep] = useState<Step>('choice');
  const [name, setName] = useState('');
  const [survey, setSurvey] = useState<SurveyDraft>(DEFAULT_SURVEY);

  useEffect(() => {
    if (isExpanded) {
      setStep('choice');
      setName('');
      setSurvey(DEFAULT_SURVEY);
    }
  }, [isExpanded]);

  const previewItems: DailyNormItems | null = useMemo(() => {
    if (step !== 'preview') return null;
    return generateNormFromSurvey(survey as NormSurvey);
  }, [step, survey]);

  const handleManualCommit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = await safeMutate(() => createDailyNorm(trimmed, ''), 'Не удалось создать норму');
    if (id === undefined) return;
    toaster.success('Норма создана');
    onClose();
  }, [name, onClose]);

  const handleAiCommit = useCallback(async () => {
    if (!previewItems) return;
    const autoName = `Под меня · ${survey.weightKg} кг`;
    const id = await safeMutate(
      () => createDailyNorm(autoName, '', previewItems),
      'Не удалось создать норму',
    );
    if (id === undefined) return;
    toaster.success('Норма подобрана');
    onClose();
  }, [previewItems, survey.weightKg, onClose]);

  return (
    <ModalByLabel
      position="fixed"
      isExpanded={isExpanded}
      content={
        <ModalShell variant="spring">
          <input
            id={CREATE_NORM_INPUT_ID}
            type="text"
            tabIndex={-1}
            aria-hidden
            readOnly
            className={styles.triggerInput}
          />
          <ModalShell.Body>
            {step === 'choice' && (
              <ChoiceStep
                onManual={() => setStep('manual')}
                onSurvey={() => setStep('survey')}
              />
            )}

            {step === 'manual' && (
              <ManualStep name={name} onNameChange={setName} />
            )}

            {step === 'survey' && (
              <SurveyStep survey={survey} onChange={setSurvey} />
            )}

            {step === 'preview' && previewItems && (
              <PreviewStep items={previewItems} survey={survey} />
            )}

            {isExpanded && step === 'choice' && (
              <ModalShell.ActionButtons
                debugId="create-norm-choice"
                left={<ModalPrevButton onClick={onClose} />}
              />
            )}
            {isExpanded && step === 'manual' && (
              <ModalShell.ActionButtons
                debugId="create-norm-manual"
                left={<ModalPrevButton onClick={() => setStep('choice')} />}
                right={
                  <ModalNextButton variant="finish" onClick={handleManualCommit} />
                }
              />
            )}
            {isExpanded && step === 'survey' && (
              <ModalShell.ActionButtons
                debugId="create-norm-survey"
                left={<ModalPrevButton onClick={() => setStep('choice')} />}
                right={<ModalNextButton onClick={() => setStep('preview')} />}
              />
            )}
            {isExpanded && step === 'preview' && (
              <ModalShell.ActionButtons
                debugId="create-norm-preview"
                left={<ModalPrevButton onClick={() => setStep('survey')} />}
                right={<ModalNextButton variant="finish" onClick={handleAiCommit} />}
              />
            )}
          </ModalShell.Body>
        </ModalShell>
      }
    />
  );
};

/* ── Step: choice ─────────────────────────────────────────── */

const PenIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);

type ChoiceStepProps = { onManual: () => void; onSurvey: () => void };

const ChoiceStep = ({ onManual, onSurvey }: ChoiceStepProps) => (
  <>
    <ModalShell.Title>Новая норма</ModalShell.Title>
    <p className={styles.subtitle}>Как будем создавать?</p>
    <div className={styles.choiceGrid}>
      <button type="button" className={styles.choiceCard} onClick={onManual}>
        <span className={styles.choiceIcon}><PenIcon /></span>
        <span className={styles.choiceTitle}>Вручную</span>
        <span className={styles.choiceHint}>чистая норма, значения задам сам</span>
      </button>
      <button type="button" className={styles.choiceCard} onClick={onSurvey}>
        <span className={styles.choiceIcon}><SparkIcon /></span>
        <span className={styles.choiceTitle}>Подобрать под меня</span>
        <span className={styles.choiceHint}>мини-анкета — посчитаем сами</span>
      </button>
    </div>
  </>
);

/* ── Step: manual ─────────────────────────────────────────── */

type ManualStepProps = {
  name: string;
  onNameChange: (v: string) => void;
};

const ManualStep = ({ name, onNameChange }: ManualStepProps) => (
  <>
    <ModalShell.Title>Название нормы</ModalShell.Title>
    <Ornament text="название" />
    <Textarea
      id={MANUAL_NAME_INPUT_ID}
      value={name}
      onChange={onNameChange}
      placeholder="Например: моя норма"
      maxLength={100}
      rows={1}
    />
    <p className={styles.hint}>Значения нутриентов добавите через «Изменить значения»</p>
  </>
);

/* ── Step: survey ─────────────────────────────────────────── */

type SurveyStepProps = {
  survey: SurveyDraft;
  onChange: (next: SurveyDraft) => void;
};

const SurveyStep = ({ survey, onChange }: SurveyStepProps) => {
  const patch = (p: Partial<SurveyDraft>) => onChange({ ...survey, ...p });

  return (
    <>
      <ModalShell.Title>Мини-анкета</ModalShell.Title>

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

      <Ornament text="цель" />
      <div className={styles.pillRow}>
        {GOAL_OPTIONS.map((o) => (
          <PillButton
            key={o.value}
            active={survey.goal === o.value}
            onClick={() => patch({ goal: o.value })}
          >
            {o.label}
          </PillButton>
        ))}
      </div>

      <Spacer variant="screen-header-offset" />
    </>
  );
};

/* ── Step: preview ────────────────────────────────────────── */

type PreviewStepProps = { items: DailyNormItems; survey: SurveyDraft };

const PreviewStep = ({ items, survey }: PreviewStepProps) => {
  const renderCard = useCallback(
    (nutrient: Nutrient) => {
      const val = items[nutrient.id] ?? 0;
      return (
        <NutrientCard content={nutrient} showValue={false}>
          <span>{val} {nutrient.unitRu}</span>
        </NutrientCard>
      );
    },
    [items],
  );

  return (
    <>
      <ModalShell.Title>Ваша норма</ModalShell.Title>
      <p className={styles.subtitle}>
        {survey.weightKg} кг · {survey.heightCm} см · {survey.age} лет
      </p>
      <div className={styles.previewCards}>
        <Nutrients renderCard={renderCard} excludeGroups={['aminoAcids']} />
      </div>
      <Spacer variant="screen-header-offset" />
    </>
  );
};

/* ── Small UI helpers ─────────────────────────────────────── */

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v || min));

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

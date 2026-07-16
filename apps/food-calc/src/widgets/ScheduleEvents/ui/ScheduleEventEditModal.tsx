import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { TimeChoose, type TimeRangeState } from '@/shared/ui/TimeChoose';
import { ActionList } from '@/shared/ui/ActionList';
import { ScaleSlider } from '@/shared/ui/ScaleSlider';
import {
  updateScheduleEvent,
  type ScheduleEvent,
  type ScaleAtom,
} from '@/entities/schedule-event';
import { safeMutate } from '@/shared/lib/safeMutate';
import { drawerStore } from '@/shared/ui/drawer-store';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { EDIT_MODAL_INPUT_IDS } from './ScheduleEventEditModal.constants';
import { ASPECT_COUNT, ASPECT_PLACEHOLDERS } from './EventCreateModal.constants';
import type { AspectDraft } from './EventCreateModal';
import s from './ScheduleEventEditModal.module.scss';

type Step = 'idle' | 'time' | 'text' | 'atoms';

// Линейка стартует в середине — нейтральная точка для новых (пустых) аспектов.
const DEFAULT_ASPECT_VALUE = 5;

type DraftState = {
  time: string;
  endTime: string | null;
  text: string;
  aspects: AspectDraft[];
};

type Props = {
  item: ScheduleEvent;
  initialStep?: Step;
  onClose: () => void;
};

// Существующие аспекты в фиксированные ASPECT_COUNT строк (зеркалит офлайн-форму).
// Хвост добивается пустыми — юзер может дописать оценку прямо в правке.
const seedAspects = (item: ScheduleEvent): AspectDraft[] => {
  const atoms = (typeof item.atoms === 'string' ? JSON.parse(item.atoms) : item.atoms ?? []) as ScaleAtom[];
  const rows: AspectDraft[] = atoms.map((a) => ({ label: a.label ?? '', value: a.value }));
  while (rows.length < ASPECT_COUNT) rows.push({ label: '', value: DEFAULT_ASPECT_VALUE });
  return rows;
};

const ScheduleEventEditModal = ({ item, initialStep = 'idle', onClose }: Props) => {
  const [step, setStep] = useState<Step>(initialStep);
  // Keyed by item.id via the parent `overlay` — a fresh mount per opened event
  // seeds the draft from `item`, so no effect-sync is needed.
  const [draft, setDraft] = useState<DraftState>(() => ({
    time: item.time,
    endTime: item.endTime ?? null,
    text: item.text ?? '',
    aspects: seedAspects(item),
  }));

  // Строки < seededCount пришли из реального атома — сохраняем даже без лейбла (число
  // осмысленно). Добавленные хвостовые строки материализуются ТОЛЬКО непустым лейблом
  // (иначе дефолтная «5» без имени цепляла бы фантомную оценку — баг критики 2026-07-15).
  const [seededCount] = useState(() => (Array.isArray(item.atoms) ? item.atoms.length : 0));

  useSwipeableLock(step !== 'idle');
  useOverlayHistory(step !== 'idle', () => {
    setStep('idle');
    onClose();
  });

  const handleClose = () => {
    setStep('idle');
    onClose();
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === EDIT_MODAL_INPUT_IDS.TIME_INPUT) setStep('time');
    else if (id === EDIT_MODAL_INPUT_IDS.TEXT_INPUT) setStep('text');
    else if (id === EDIT_MODAL_INPUT_IDS.ATOMS_INPUT) setStep('atoms');
    else return;

    // Медаль ItemActionsDrawer только что делегировала фокус сюда — закрываем дровер
    // (открыт с trapFocus:false). No-op при правке тапом по карточке.
    drawerStore.closeLast();

    // Прокси-инпут оценки readOnly (открывашка шага) — скроллить не нужно, поля
    // аспектов сами центрируются по своему фокусу. Мелкие инпуты (время/текст) центрируем.
    if (id === EDIT_MODAL_INPUT_IDS.ATOMS_INPUT) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => setDraft((prev) => ({ ...prev, time }));

  const handleRangeChange = (range: TimeRangeState) => {
    setDraft((prev) => ({ ...prev, time: range.from, endTime: range.toExplicitlySet ? range.to : null }));
  };

  const handleTextChange = (value: string) => setDraft((prev) => ({ ...prev, text: value }));

  const handleAspectChange = (index: number, patch: Partial<AspectDraft>) => {
    setDraft((prev) => ({
      ...prev,
      aspects: prev.aspects.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }));
  };

  const commit = async () => {
    const atoms: ScaleAtom[] = draft.aspects
      .filter((a, i) => a.label.trim().length > 0 || i < seededCount)
      .map((a) => ({ kind: 'scale', value: a.value, label: a.label.trim() || undefined }));
    const result = await safeMutate(
      () => updateScheduleEvent(item.id, { time: draft.time, endTime: draft.endTime ?? undefined, text: draft.text, atoms }),
      'Не удалось обновить событие',
    );
    if (!result.ok) return;
    setStep('idle');
    onClose();
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Time */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell>
            <ModalShell.Header title="Выберите время" onBack={handleClose} />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={EDIT_MODAL_INPUT_IDS.TIME_INPUT}
                range={{
                  initialFrom: draft.time,
                  initialTo: draft.endTime ?? undefined,
                  onChangeRange: handleRangeChange,
                }}
              />
              <ModalShell.ActionButtons right={<ModalNextButton onClick={commit} variant="finish" />} />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Text */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <ModalShell>
            <ModalShell.Header title="Опишите событие" onBack={handleClose} />
            <ModalShell.Body>
              <AutoGrowSearch
                id={EDIT_MODAL_INPUT_IDS.TEXT_INPUT}
                onChange={handleTextChange}
                value={draft.text}
                placeholder="Опишите событие"
              />
              <ModalShell.ActionButtons right={<ModalNextButton onClick={commit} variant="finish" />} />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Aspects — label + линейка 0..10 на строку (те же примитивы, что офлайн-форма). */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'atoms'}
        content={
          <ModalShell>
            <ModalShell.Header title="Оценки" onBack={handleClose} />
            <ModalShell.Body>
              {/* `<label htmlFor>` с карточки/медали делегирует фокус сюда — readOnly-
                  прокси лишь раскрывает шаг (клавиатуры нет). */}
              <input
                id={EDIT_MODAL_INPUT_IDS.ATOMS_INPUT}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
              />
              <ActionList>
                <ActionList.Section label="Оценочные варианты">
                  {draft.aspects.map((aspect, index) => (
                    <div key={index} className={s.aspect}>
                      <AutoGrowSearch
                        singleLine
                        value={aspect.label}
                        onChange={(v) => handleAspectChange(index, { label: v })}
                        placeholder={ASPECT_PLACEHOLDERS[index] ?? 'Оценочный вариант'}
                      />
                      <ScaleSlider
                        value={aspect.value}
                        onChange={(v) => handleAspectChange(index, { value: v })}
                        ariaLabel={aspect.label.trim() || `Оценочный вариант ${index + 1}, 0–10`}
                      />
                    </div>
                  ))}
                </ActionList.Section>
              </ActionList>
              <ModalShell.ActionButtons right={<ModalNextButton onClick={commit} variant="finish" />} />
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleEventEditModal;

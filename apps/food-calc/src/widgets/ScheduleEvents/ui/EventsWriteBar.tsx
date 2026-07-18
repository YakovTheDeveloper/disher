import { useCallback, useEffect, useRef, useState } from 'react';
import { WriteBarShell, type SendState } from '@/shared/ui/WriteBarShell';
import { Heading } from '@/shared/ui/atoms/Typography';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { FeatureErrorBoundary } from '@/shared/ui/error/FeatureErrorBoundary';
import { addScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import { safeMutate } from '@/shared/lib/safeMutate';
import { markAdded } from '@/shared/model/recentlyAddedStore';
import { scrollToNewRow } from '@/features/food/food-entry-flow/scrollToNewRow';
import toaster from '@/shared/lib/toaster/toaster';
import { useWriteEventFlow } from '../model/useWriteEventFlow';
import EventCreateModal, { type AspectDraft } from './EventCreateModal';
import { InlineWriteEventReview } from './InlineWriteEventReview';
import { AddEventMedal } from './AddEventMedal';
import {
  EVENT_CREATE_MAIN_INPUT_ID,
  EVENT_WRITE_INPUT_ID,
  ASPECT_COUNT,
} from './EventCreateModal.constants';
import s from './EventsWriteBar.module.scss';

const PLACEHOLDER = 'Опишите, что происходит';
const LOADING_PLACEHOLDER = 'Распознаём…';

// Карусель примеров на пустом баре — показывает, что онлайн-путь умеет период и
// оценки (в отличие от офлайн-формы «Вручную»).
const PLACEHOLDER_EXAMPLES = [
  'Спал с 23:00 до 7:00, качество сна 6 из 10',
  'Тренировка, энергия 8, без разминки',
  'Болит голова, тревога 7',
  'Принял витамин D утром',
];

// Подсказка бара за ⓘ в доке над баром (бумажка-поповер, а не инлайн-раскрытие,
// 2026-07-17). Что умеет онлайн-путь + куда деться без сети. Выделение понятий —
// <strong> (вес): Onest без курсива. Пример формата живёт в PLACEHOLDER_EXAMPLES.
const EVENT_HINT = (
  <>
    <p>
      Опишите, что происходит, обычными словами — событие, период и оценки от 0 до 10: например,{' '}
      <strong>«спал с 23:00 до 7:00, качество сна 6»</strong>. Разберём в карточку сами.
    </p>
    <p>
      Распознавание работает <strong>только онлайн</strong>. Без сети добавьте событие{' '}
      <strong>вручную</strong> — кнопкой справа.
    </p>
  </>
);

// Офлайн-черновик: линейка стартует в середине — нейтральная точка отсчёта.
const DEFAULT_ASPECT_VALUE = 5;
const emptyAspects = (): AspectDraft[] =>
  Array.from({ length: ASPECT_COUNT }, () => ({ label: '', value: DEFAULT_ASPECT_VALUE }));

type Props = {
  /** dd-MM-yyyy day to attach the event to. */
  scheduleId: string;
};

/**
 * Нижний бар экрана «События» — ДВА пути (по образцу экрана еды, 2026-07-15):
 *   • ОНЛАЙН (инпут бара): свободный текст → LLM-разбор на бэке (период + оценки)
 *     → review-панель ниже бара (`InlineWriteEventReview`) → batch-коммит.
 *   • ОФЛАЙН (медаль «Вручную» справа): `RoundButton htmlFor` открывает типовую
 *     форму `EventCreateModal` через `ModalByLabel` (onFocusCapture ловит фокус).
 *
 * Док (бар + панель) лифтится над клавиатурой (`useKeyboardStick` transform),
 * лочит дневной пейджер и заворачивает Back, пока открыт любой из путей.
 */
const EventsWriteBar = ({ scheduleId }: Props) => {
  const online = useOnline();
  const flow = useWriteEventFlow(scheduleId);

  const isLoading = flow.state === 'loading';
  const panelOpen = flow.state === 'ready';

  // ─── Офлайн-модалка (черновик формы) ───
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [offlineText, setOfflineText] = useState('');
  const [offlineAspects, setOfflineAspects] = useState<AspectDraft[]>(emptyAspects);
  const offlineSubmittingRef = useRef(false);

  useEffect(() => {
    setOfflineOpen(false);
    setOfflineText('');
    setOfflineAspects(emptyAspects());
    offlineSubmittingRef.current = false;
  }, [scheduleId]);

  const dockRef = useKeyboardStick<HTMLDivElement>({ mode: 'transform', enabled: panelOpen });
  useSwipeableLock(panelOpen || offlineOpen);
  useOverlayHistory(panelOpen, flow.cancel);
  useOverlayHistory(offlineOpen, () => setOfflineOpen(false));
  useEffect(() => {
    if (!panelOpen) dockRef.current?.style.removeProperty('transform');
  }, [panelOpen, dockRef]);

  // Фокус главного инпута офлайн-модалки (делегирован медалью «Вручную») раскрывает её.
  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    if ((e.target as HTMLElement).id === EVENT_CREATE_MAIN_INPUT_ID) setOfflineOpen(true);
  }, []);

  const closeOffline = useCallback(() => setOfflineOpen(false), []);

  const handleAspectChange = useCallback((index: number, patch: Partial<AspectDraft>) => {
    setOfflineAspects((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }, []);

  const offlineHasText = offlineText.trim().length > 0;
  const offlineFilled = offlineAspects.filter((a) => a.label.trim().length > 0);
  const offlineCanSubmit = offlineHasText || offlineFilled.length > 0;

  const handleOfflineSubmit = useCallback(async () => {
    if (offlineSubmittingRef.current) return;
    const trimmed = offlineText.trim();
    const atoms: Atom[] = offlineAspects
      .filter((a) => a.label.trim().length > 0)
      .map((a) => ({ kind: 'scale', value: a.value, label: a.label.trim() }));
    if (!trimmed && atoms.length === 0) return;
    offlineSubmittingRef.current = true;

    const time = new Date().toTimeString().slice(0, 5);
    const result = await safeMutate(
      () => addScheduleEvent({ date: scheduleId, time, text: trimmed || undefined, atoms }),
      'Не удалось создать событие'
    );
    offlineSubmittingRef.current = false;
    if (!result.ok) return;
    markAdded([result.value]);
    scrollToNewRow(result.value);
    setOfflineText('');
    setOfflineAspects(emptyAspects());
    setOfflineOpen(false);
  }, [offlineText, offlineAspects, scheduleId]);

  // ─── Онлайн-бар (LLM) ───
  const handleOnlineSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      // Распознавание требует сети (LLM). Офлайн — путь «Вручную» справа.
      if (!online) {
        toaster.error(
          'Нет сети — распознавание требует интернет. Добавьте вручную кнопкой справа.'
        );
        return false; // держим фокус (blurOnSubmit)
      }
      flow.submit(trimmed);
    },
    [flow, online]
  );

  const computeSend = useCallback(
    ({ hasText }: { hasText: boolean }): SendState => ({ visible: hasText, enabled: hasText }),
    []
  );

  // На ready инпут бара уступает место заголовку — панель ниже несёт сам разбор.
  const readyHeader = (
    <div className={s.readyHeader}>
      <Heading as="h2" role="headline" className={s.readyHeaderTitle}>
        Проверьте события
      </Heading>
    </div>
  );

  return (
    <div
      className={s.dock}
      ref={dockRef}
      data-open={panelOpen || undefined}
      onFocusCapture={handleFocusCapture}
    >
      <WriteBarShell
        className={s.bar}
        value={isLoading ? '' : flow.inputText}
        onChange={flow.setInputText}
        onSubmit={handleOnlineSubmit}
        inputId={EVENT_WRITE_INPUT_ID}
        placeholder={isLoading ? LOADING_PLACEHOLDER : PLACEHOLDER}
        placeholderExamples={PLACEHOLDER_EXAMPLES}
        online={online}
        computeSend={computeSend}
        busy={isLoading}
        readOnly={isLoading}
        fieldOverride={panelOpen ? readyHeader : undefined}
        overlayVisible={panelOpen}
        blurOnSubmit
        hintPopover={EVENT_HINT}
        focusTitle="Опишите событие"
        minRows={1}
        trailingSlot={panelOpen ? undefined : <AddEventMedal />}
      />

      {panelOpen && (
        <div className={s.reviewPanel}>
          <FeatureErrorBoundary label="Разбор события">
            <InlineWriteEventReview flow={flow} />
          </FeatureErrorBoundary>
        </div>
      )}

      <ModalByLabel
        position="fixed"
        isExpanded={offlineOpen}
        content={
          <EventCreateModal
            text={offlineText}
            onTextChange={setOfflineText}
            aspects={offlineAspects}
            onAspectChange={handleAspectChange}
            canSubmit={offlineCanSubmit}
            onSubmit={handleOfflineSubmit}
            onClose={closeOffline}
          />
        }
      />
    </div>
  );
};

export default EventsWriteBar;

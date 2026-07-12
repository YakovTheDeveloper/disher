import styles from './ScheduleEvents.module.scss';
import React, { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TimeGroup } from '@/features/time-group';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { removeScheduleEvents } from '@/entities/schedule-event';
import clsx from 'clsx';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen, type TopBarHideTarget } from '@/shared/ui/Screen';
import { Heading } from '@/shared/ui/atoms/Typography';
import { groupItemsByTime } from '@/shared/lib/schedule';
import {
  ScheduleEventEditModal,
  EVENT_EDIT_MODAL_INPUT_IDS,
  EventsWriteBar,
} from './ui';
import { ScheduleEventCard } from './components/ScheduleEventCard';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { buildEventEditActions } from './eventActions';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { drawerStore } from '@/shared/ui/drawer-store';
import { useCardPalette } from '@/shared/lib/cardPalette';

type Props = {
  children?: React.ReactNode;
  date: string;
  events: ScheduleEvent[];
  topSlot?: React.ReactNode;
  /**
   * Заголовок-дата в верхнем слоте `Screen`. Владелец — HomePage (общий на оба
   * экрана дека); ScheduleEvents только прокидывает его в `Screen.topContent`.
   */
  topContent?: React.ReactNode;
  /** Прокидывается в `Screen` → направление-зависимое скрытие кнопок бара. */
  topBarHide?: TopBarHideTarget;
};

const ScheduleEvents = ({ date, events, topSlot, topContent, topBarHide }: Props) => {
  const eventsGroupedByTime = useMemo(() => groupItemsByTime(events), [events]);

  // Палитра карточек «событий» — постоянный пер-поверхностный выбор из настроек
  // (ProfileDrawer → «Цвет карточек»). Дефолт amber. Раньше был общий контрол в
  // dev-DesignBar (единый ключ на еду/блюдо/события).
  const palette = useCardPalette('events');
  const { t } = useTranslation();

  const [editingItem, setEditingItem] = useState<ScheduleEvent | null>(null);
  const [editingStep, setEditingStep] = useState<'idle' | 'time' | 'text' | 'atoms'>('idle');

  const closeEditModal = () => {
    setEditingItem(null);
    setEditingStep('idle');
  };

  const openEditModal = (item: ScheduleEvent, step: 'time' | 'text' | 'atoms') => {
    setEditingItem(item);
    setEditingStep(step);
  };

  // Праймит item БЕЗ шага (шаг ставит focus-делегация медали) — модалка монтируется
  // свёрнутой, её always-input'ы существуют для `<label htmlFor>`. Синхронный setStep
  // здесь размонтировал бы label дровера до делегирования (CLAUDE.md «Label focus
  // delegation»); шаг флипает handleFocusCapture модалки, оно же закрывает дровер.
  const primeEditEvent = (item: ScheduleEvent) => {
    setEditingItem(item);
    setEditingStep('idle');
  };

  // Long-press → per-item action drawer: delete (top-right) + ряд из трёх круглых
  // медалей (тот же WriteBarMedal, что у еды): Особенности · Описание · Время. У
  // события нет detail-страницы, поэтому ряд заменяет «info»-действие.
  const openActionsDrawer = (item: ScheduleEvent) => {
    void drawerStore.show(
      ItemActionsDrawer,
      {
        title: item.text || 'Событие',
        onDelete: async () => {
          const res = await safeMutate(() => removeScheduleEvents([item.id]), 'Не удалось удалить');
          if (res.ok) toaster.success('Удалено');
        },
        actions: [],
        editActions: buildEventEditActions(() => primeEditEvent(item)),
      },
      // trapFocus:false — иначе focus-trap дровера завернул бы делегацию медали
      // назад, и фокус не дошёл бы до input'а edit-модалки (он вне портала дровера).
      { trapFocus: false }
    );
  };

  return (
    <Screen
      stickyTop={topSlot}
      headerOverlap
      topBarHide={topBarHide}
      // Дата дня — общий элемент, построенный HomePage (2026-07-04); экран только
      // прокидывает его в верхний слот листа.
      topContent={topContent}
      overlay={
        editingItem && (
          <ScheduleEventEditModal
            item={editingItem}
            initialStep={editingStep}
            onClose={closeEditModal}
          />
        )
      }
      key={3}
      bottomBar={<EventsWriteBar scheduleId={date} />}
    >
      <Heading role="display" masthead as="h2">События дня</Heading>
      {events.length === 0 ? (
        <EmptyState
          className={styles.empty}
          title={t('schedule.empty.events.title')}
          description={t('schedule.empty.events.description')}
        />
      ) : (
      <section data-dv-v={palette} className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <ItemsList>
            {(() => {
              let globalIndex = 0;
              return eventsGroupedByTime.map((timeGroup) => (
                <React.Fragment key={timeGroup.startTime}>
                  <TimeGroup group={timeGroup}>
                    {(() => {
                      // Dedup the per-row time (reset per group): a row matching
                      // the time above renders blank but stays tappable to edit.
                      let prevTime: string | null = null;
                      return timeGroup.items.map((item) => {
                      const itemIndex = globalIndex++;
                      const dimTime = prevTime === item.time;
                      prevTime = item.time;
                      return (
                        <ScheduleEventCard
                          key={item.id}
                          item={item}
                          index={itemIndex}
                          dimTime={dimTime}
                          totalCount={events.length}
                          onLongPress={() => openActionsDrawer(item)}
                          onEditTime={() => openEditModal(item, 'time')}
                          onEditText={() => openEditModal(item, 'text')}
                          onEditAtoms={() => openEditModal(item, 'atoms')}
                          timeHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.TIME_INPUT}
                          textHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.TEXT_INPUT}
                          atomsHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.ATOMS_INPUT}
                        />
                      );
                      });
                      })()}
                  </TimeGroup>
                </React.Fragment>
              ));
            })()}
        </ItemsList>
      </section>
      )}
    </Screen>
  );
};

export default memo(ScheduleEvents);

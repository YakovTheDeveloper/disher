import styles from './ScheduleEvents.module.scss';
import React, { useMemo, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { TimeGroup } from '@/features/time-group';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { removeScheduleEvents } from '@/entities/schedule-event';
import clsx from 'clsx';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { Screen } from '@/shared/ui/Screen';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import AddButton from '@/shared/ui/atoms/Button/AddButton/AddButton';
import { groupItemsByTime, getNowMarkerIndex } from '@/shared/lib/schedule';
import { NowMarker } from '@/shared/ui/NowMarker';
import { getTitle } from '@/pages/home-page/ui/methods';
import {
  ScheduleEventCreateModals,
  EVENT_MODAL_INPUT_IDS,
  ScheduleEventEditModal,
  EVENT_EDIT_MODAL_INPUT_IDS,
} from './ui';
import { ScheduleEventCard } from './components/ScheduleEventCard';
import { IconButton } from '@/shared/ui/atoms/Button/IconButton';
import toaster from '@/shared/lib/toaster/toaster';
import { drawerStore } from '@/shared/ui/drawer-store';
import { DeleteConfirmationModal } from '@/widgets/FoodSchedule/ui/drawers';
import normsImg from '@/shared/assets/decarative/norms.png';

type Props = {
  children?: React.ReactNode;
  date: string;
  events: ScheduleEvent[];
};

const ScheduleEvents = ({ date, events }: Props) => {
  const selectionStoreEvents = useSelection();
  const isActionsMode = useStore(selectionStoreEvents, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStoreEvents, (s) => s.selectedIds);
  const { clearSelection, toggleSelectedId } = selectionStoreEvents.getState();
  const eventsGroupedByTime = useMemo(() => groupItemsByTime(events), [events]);
  const nowMarkerIndex = useMemo(
    () => getNowMarkerIndex(eventsGroupedByTime, date),
    [eventsGroupedByTime, date]
  );

  const onDeleteSelected = async () => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    const confirmed = await drawerStore.show(DeleteConfirmationModal, { count: ids.length });
    if (!confirmed) return;
    await removeScheduleEvents(ids);
    clearSelection();
    toaster.success(`Удалено: ${ids.length}`);
  };

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

  const reducedMotion = useReducedMotion();

  const dateLabel = useMemo(() => {
    try {
      const { day, monthNumber } = getTitle(date);
      const dayPadded = String(day).padStart(2, '0');
      const yearShort = String(new Date().getFullYear()).slice(-2);
      return `${dayPadded}.${monthNumber}.${yearShort}`;
    } catch {
      return '';
    }
  }, [date]);

  return (
    <Screen
      offsetTop
      overlay={
        <>
          <ScheduleEventCreateModals scheduleId={date} />
          {editingItem && (
            <ScheduleEventEditModal
              item={editingItem}
              initialStep={editingStep}
              onClose={closeEditModal}
            />
          )}
        </>
      }
      actions={
        <ActionsPanel
          show={isActionsMode}
          onBack={() => clearSelection()}
          left={
            <IconButton icon={<TrashIcon />} onClick={onDeleteSelected}>
              Удалить
            </IconButton>
          }
        >
          экшены событий
        </ActionsPanel>
      }
      key={3}
      bottomRight={
        events.length > 0 ? (
          <AddButton htmlFor={EVENT_MODAL_INPUT_IDS.TIME_INPUT} as="label" onClick={() => {}} dark />
        ) : (
          <AddButton
            onClick={() => {}}
            as="label"
            htmlFor={EVENT_MODAL_INPUT_IDS.TIME_INPUT}
            prominent
            dark
          >
            Добавить
          </AddButton>
        )
      }
    >
      <header className={styles.dayHeader}>
        <h2 className={styles.dayHeaderTitle}>
          <span className={styles.dayHeaderTitleInitial}>С</span>обытия
        </h2>
        <p className={styles.dayHeaderDate}>{dateLabel}</p>
        <img className={styles.dayHeaderImg} src={normsImg} alt="" aria-hidden />
      </header>
      <section className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <ItemsList offsetTop>
          {(() => {
            let globalIndex = 0;
            const rendered = eventsGroupedByTime.map((timeGroup, idx) => (
              <React.Fragment key={timeGroup.time}>
                {nowMarkerIndex === idx && <NowMarker />}
                <TimeGroup
                  group={timeGroup}
                  isFuture={nowMarkerIndex >= 0 && idx >= nowMarkerIndex}
                >
                  {timeGroup.items.map((item) => {
                    const itemIndex = globalIndex++;
                    return (
                      <ScheduleEventCard
                        key={item.id}
                        item={item}
                        index={itemIndex}
                        totalCount={events.length}
                        isSelectMode={isActionsMode}
                        isSelected={selectedIds.includes(item.id)}
                        onSelect={toggleSelectedId}
                        onEditTime={() => openEditModal(item, 'time')}
                        onEditText={() => openEditModal(item, 'text')}
                        onEditAtoms={() => openEditModal(item, 'atoms')}
                        timeHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.TIME_INPUT}
                        textHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.TEXT_INPUT}
                        atomsHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.ATOMS_INPUT}
                      />
                    );
                  })}
                </TimeGroup>
                {nowMarkerIndex === eventsGroupedByTime.length &&
                  idx === eventsGroupedByTime.length - 1 && <NowMarker />}
              </React.Fragment>
            ));
            if (reducedMotion) return rendered;
            return <AnimatePresence initial={false}>{rendered}</AnimatePresence>;
          })()}
        </ItemsList>
      </section>
    </Screen>
  );
};

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default ScheduleEvents;

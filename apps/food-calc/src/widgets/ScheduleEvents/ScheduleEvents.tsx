import styles from './ScheduleEvents.module.scss';
import React, { useMemo, useState } from 'react';
import { TimeGroup } from '@/features/time-group';
import type { ScheduleEvent } from '@/entities/schedule-event';
import clsx from 'clsx';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { Screen } from '@/shared/ui/Screen';
import { Navigation } from '@/pages/home-page/ui';
import Typography from '@/shared/ui/atoms/Typography/Typography';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import AddButton from '@/shared/ui/atoms/Button/AddButton/AddButton';
import { groupItemsByTime, getNowMarkerIndex } from '@/shared/lib/schedule';
import { NowMarker } from '@/shared/ui/NowMarker';
import {
  ScheduleEventCreateModals,
  EVENT_MODAL_INPUT_IDS,
  ScheduleEventEditModal,
  EVENT_EDIT_MODAL_INPUT_IDS,
} from './ui';
import { ScheduleEventCard } from './components/ScheduleEventCard';
import { PeriodBanner } from '@/features/ScheduleSelection/SchedulePeriods';

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
  const nowMarkerIndex = useMemo(() => getNowMarkerIndex(eventsGroupedByTime, date), [eventsGroupedByTime, date]);

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
            <button
              onClick={() => {
                // TODO: migrate to drawerStore.show() for delete confirmation
              }}
            >
              удалить
            </button>
          }
        >
          экшены событий
        </ActionsPanel>
      }
      key={3}
      title={<Typography variant="feature-title">События</Typography>}
      header={
        <Navigation title={<Typography variant="feature-title-2">События</Typography>}></Navigation>
      }
      bottomRight={
        events.length > 0 ? (
          <AddButton htmlFor={EVENT_MODAL_INPUT_IDS.TIME_INPUT} as="label" onClick={() => {}} />
        ) : null
      }
    >
      {events.length === 0 && (
        <div style={{ padding: 'var(--space-10) var(--space-4) 0' }}>
          <AddButton
            onClick={() => {}}
            as="label"
            htmlFor={EVENT_MODAL_INPUT_IDS.TIME_INPUT}
            prominent
          >
            Добавить событие
          </AddButton>
        </div>
      )}
      <PeriodBanner date={date} />
      <section className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <ItemsList offsetTop>
          {(() => {
            let globalIndex = 0;
            return eventsGroupedByTime.map((timeGroup, idx) => (
              <React.Fragment key={timeGroup.time}>
                {nowMarkerIndex === idx && <NowMarker />}
                <TimeGroup group={timeGroup} isFuture={nowMarkerIndex >= 0 && idx >= nowMarkerIndex}>
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
                {nowMarkerIndex === eventsGroupedByTime.length && idx === eventsGroupedByTime.length - 1 && <NowMarker />}
              </React.Fragment>
            ));
          })()}
        </ItemsList>
      </section>
    </Screen>
  );
};

export default ScheduleEvents;

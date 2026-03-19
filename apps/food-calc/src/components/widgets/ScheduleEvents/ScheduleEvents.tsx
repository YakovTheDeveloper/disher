import styles from './ScheduleEvents.module.scss';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { useMemo, useState } from 'react';
import { TimeGroup } from '@/components/features/time-group';
import type { ScheduleEvent } from '@/entities/schedule-event';
import clsx from 'clsx';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Navigation } from '@/components/features/builders/ScheduleBuilder/ui/Navigation';
import Typography from '@/components/ui/atoms/Typography/Typography';
import { ActionsPanel } from '@/components/features/builders/shared/components/ActionsPanel';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import { groupItemsByTime } from '@/shared/lib/schedule';
import {
  ScheduleEventCreationModals,
  EVENT_MODAL_INPUT_IDS,
  EditScheduleEventModal,
} from './ui';

type Props = {
  children?: React.ReactNode;
  date: string;
  events: ScheduleEvent[];
};

export function getEventDescription(item: ScheduleEvent): string {
  const parts: string[] = [];

  if (item.time) {
    parts.push(item.time);
  }

  if (item.text) {
    parts.push(item.text);
  }

  if (parts.length === 0) {
    return 'Новое событие';
  }

  return parts.join(' • ');
}

const ScheduleEvents = ({ date, events }: Props) => {
  const selectionStoreEvents = useSelection();
  const isActionsMode = useStore(selectionStoreEvents, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStoreEvents, (s) => s.selectedIds);
  const { clearSelection, toggleSelectedId } = selectionStoreEvents.getState();
  const eventsGroupedByTime = useMemo(() => groupItemsByTime(events), [events]);

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
          <ScheduleEventCreationModals scheduleId={date} />
          {editingItem && (
            <EditScheduleEventModal
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
        <Navigation title={<Typography variant="feature-title">События</Typography>}></Navigation>
      }
      bottomRight={<AddButton htmlFor={EVENT_MODAL_INPUT_IDS.TIME_INPUT} as="label" onClick={() => {}} />}
    >
      <section className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <ItemsList offsetTop>
          {eventsGroupedByTime.map((timeGroup) => (
            <TimeGroup key={timeGroup.time} group={timeGroup}>
              {timeGroup.items.map((item) => {
                return (
                  <CommonListItem
                    className={styles.listItemRow}
                    id={item.id}
                    key={item.id}
                    isSelectMode={isActionsMode}
                    isSelected={selectedIds.includes(item.id)}
                    onSelect={toggleSelectedId}
                    onClick={() => openEditModal(item, 'time')}
                  >
                    <p>{getEventDescription(item)}</p>
                  </CommonListItem>
                );
              })}
            </TimeGroup>
          ))}
        </ItemsList>
      </section>
    </Screen>
  );
};

export default ScheduleEvents;

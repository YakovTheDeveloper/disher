import styles from './ScheduleEvents.module.scss';
import { useMemo, useState } from 'react';
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
import { groupItemsByTime } from '@/shared/lib/schedule';
import {
  ScheduleEventCreationModals,
  EVENT_MODAL_INPUT_IDS,
  EditScheduleEventModal,
  EVENT_EDIT_MODAL_INPUT_IDS,
} from './ui';
import { ScheduleEventCard } from './components/ScheduleEventCard';

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
        <Navigation title={<Typography variant="feature-title-2">События</Typography>}></Navigation>
      }
      bottomRight={
        <AddButton htmlFor={EVENT_MODAL_INPUT_IDS.TIME_INPUT} as="label" onClick={() => {}} />
      }
    >
      <section className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <ItemsList offsetTop>
          {eventsGroupedByTime.map((timeGroup) => (
            <TimeGroup key={timeGroup.time} group={timeGroup}>
              {timeGroup.items.map((item) => (
                <ScheduleEventCard
                  key={item.id}
                  item={item}
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
              ))}
            </TimeGroup>
          ))}
        </ItemsList>
      </section>
    </Screen>
  );
};

export default ScheduleEvents;

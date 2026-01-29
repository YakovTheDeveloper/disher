import React from 'react';
import { ScheduleEventsAdd } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/modal/ScheduleEventsAdd';
import { ScheduleFoodAdd } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/ScheduleFoodAdd';
import {
  DraftScheduleItemProvider,
  SelectedEventItemProvider,
  SelectedScheduleItemProvider,
  ScheduleProvider,
} from '@/components/features/builders/ScheduleBuilder/context';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { WizardPayloadInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';

interface ScheduleModalProps {
  type: ModalType;
  payload?: WizardPayloadInstance;
  close: () => void;
}

export const ScheduleModals: React.FC<ScheduleModalProps> = ({ type, payload, close }) => {
  switch (type) {
    case ModalType.SCHEDULE_FOOD_ADD:
      return (
        <ScheduleProvider>
          <DraftScheduleItemProvider>
            <ScheduleFoodAdd variant="add" close={close} />
          </DraftScheduleItemProvider>
        </ScheduleProvider>
      );

    case ModalType.SCHEDULE_FOOD_EDIT:
      if (!payload?.itemToEditId) return null;
      return (
        <ScheduleProvider>
          <SelectedScheduleItemProvider itemId={payload.itemToEditId}>
            <ScheduleFoodAdd
              variant="edit"
              defaultTab={payload.defaultTab as 'foodChange' | 'time' | 'quantity'}
              close={close}
            />
          </SelectedScheduleItemProvider>
        </ScheduleProvider>
      );

    case ModalType.SCHEDULE_EVENT_ADD:
      return (
        <ScheduleProvider>
          <DraftScheduleItemProvider>
            <ScheduleEventsAdd close={close} variant="add" />
          </DraftScheduleItemProvider>
        </ScheduleProvider>
      );

    case ModalType.SCHEDULE_EVENT_EDIT:
      if (!payload?.itemToEditId) return null;
      return (
        <ScheduleProvider>
          <SelectedEventItemProvider itemId={payload.itemToEditId}>
            <ScheduleEventsAdd
              variant="edit"
              defaultTab={payload.defaultTab as 'content' | 'time' | 'value'}
              close={close}
            />
          </SelectedEventItemProvider>
        </ScheduleProvider>
      );

    default:
      return null;
  }
};

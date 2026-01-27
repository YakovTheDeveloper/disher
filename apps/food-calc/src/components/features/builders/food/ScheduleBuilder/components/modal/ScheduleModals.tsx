import React from 'react';
import { ScheduleEventsAdd } from '@/components/features/builders/food/ScheduleBuilder/components/edit-schedule-events/ScheduleEventsAdd';
import { ScheduleEventsEdit } from '@/components/features/builders/food/ScheduleBuilder/components/edit-schedule-events/ScheduleEventsEdit';
import { ScheduleFoodAdd } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/ScheduleFoodAdd';
import {
  DraftScheduleItemProvider,
  SelectedEventItemProvider,
  SelectedScheduleItemProvider,
} from '@/components/features/builders/food/ScheduleBuilder/context/ScheduleChildProvider';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { WizardPayloadInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import ScheduleProvider from '@/components/features/builders/food/ScheduleBuilder/context/ScheduleProvider';

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
          <ScheduleEventsAdd close={close} />
        </ScheduleProvider>
      );

    case ModalType.SCHEDULE_EVENT_EDIT:
      if (!payload?.itemToEditId) return null;
      return (
        <ScheduleProvider>
          <SelectedEventItemProvider itemId={payload.itemToEditId}>
            <ScheduleEventsEdit
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

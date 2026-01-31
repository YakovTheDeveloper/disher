import React from 'react';
import { DishFoodAdd } from '@/components/features/builders/DishBuilder/components/drawer/dish-food-actions/DishFoodAdd';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { WizardPayloadInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import {
  DishProvider,
  DraftDishItemProvider,
  SelectedDishItemProvider,
} from '@/components/features/builders/DishBuilder/context';

interface DishModalProps {
  type: ModalType;
  payload?: WizardPayloadInstance;
  close: () => void;
}

export const DishModals: React.FC<DishModalProps> = ({ type, payload, close }) => {
  switch (type) {
    case ModalType.DISH_CREATE:
      return (
        <DishProvider>
          <DraftDishItemProvider>
            <DishFoodAdd close={close} variant="add" />
          </DraftDishItemProvider>
        </DishProvider>
      );

    case ModalType.DISH_EDIT:
      if (!payload?.itemToEditId) return null;
      return (
        <DishProvider>
          <SelectedDishItemProvider itemId={payload.itemToEditId}>
            <DishFoodAdd
              defaultTab={payload.defaultTab as 'content' | 'quantity'}
              close={close}
              variant="edit"
            />
          </SelectedDishItemProvider>
        </DishProvider>
      );

    default:
      return null;
  }
};

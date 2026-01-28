import React from 'react';
import { DishFoodAdd } from '@/components/features/builders/food/DishBuilder/components/drawer/dish-food-actions/DishFoodAdd';
import { DishFoodEdit } from '@/components/features/builders/food/DishBuilder/components/drawer/dish-food-actions/DishFoodEdit';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { WizardPayloadInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import {
  DishProvider,
  SelectedDishItemProvider,
} from '@/components/features/builders/food/DishBuilder/context';

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
          <DishFoodAdd close={close} />
        </DishProvider>
      );

    case ModalType.DISH_EDIT:
      if (!payload?.itemToEditId) return null;
      return (
        <DishProvider>
          <SelectedDishItemProvider itemId={payload.itemToEditId}>
            <DishFoodEdit defaultTab={payload.defaultTab as 'content' | 'quantity'} close={close} />
          </SelectedDishItemProvider>
        </DishProvider>
      );

    default:
      return null;
  }
};

// ModalDailyScheduleContext.tsx

import { ModalsType } from '@/components/blocks/builders/food/DishBuilder/DishBuilder';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router';

const modalStoreSingleton = new ModalStoreUI<ModalsType>();
const ModalContext = createContext(modalStoreSingleton); // uses the one and only instance

export const ModalDishProvider = ({ children }) => {
  const navigate = useNavigate();
  modalStoreSingleton.setNavigate(navigate);
  return <ModalContext.Provider value={modalStoreSingleton}>{children}</ModalContext.Provider>;
};

export const useDishModals = () => useContext(ModalContext);

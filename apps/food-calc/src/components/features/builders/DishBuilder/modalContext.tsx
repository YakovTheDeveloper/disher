// ModalDailyScheduleContext.tsx

import { ModalsType } from '@/components/features/builders/DishBuilder/DishBuilder';
import { ModalStoreUI } from '@/components/features/builders/shared/ModalStoreUI';
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

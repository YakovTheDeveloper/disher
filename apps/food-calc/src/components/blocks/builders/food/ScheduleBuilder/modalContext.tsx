// ModalDailyScheduleContext.tsx
import { ModalsType } from '@/components/blocks/builders/food/ScheduleBuilder/ScheduleBuilderV2';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { createContext, useContext } from 'react';

const modalStoreSingleton = new ModalStoreUI<ModalsType>();
const ModalContext = createContext(modalStoreSingleton); // uses the one and only instance

export const ModalDailyScheduleProvider = ({ children }) => {
  return <ModalContext.Provider value={modalStoreSingleton}>{children}</ModalContext.Provider>;
};

export const useDailyScheduleModals = () => useContext(ModalContext);

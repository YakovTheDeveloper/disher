import React, { createContext, useContext, ReactNode } from 'react';
import { MotionValue } from 'framer-motion';

const ScreenScrollContext = createContext<MotionValue<number> | undefined>(undefined);

interface ScreenScrollProviderProps {
  children: ReactNode;
  value: MotionValue<number>;
}

export const ScreenScrollProvider: React.FC<ScreenScrollProviderProps> = ({ children, value }) => {
  return <ScreenScrollContext.Provider value={value}>{children}</ScreenScrollContext.Provider>;
};

export const useScreenScroll = (): MotionValue<number> => {
  const context = useContext(ScreenScrollContext);

  if (context === undefined) {
    throw new Error('useScreenScroll must be used within a ScreenScrollProvider');
  }

  return context;
};

export default ScreenScrollContext;

import { useParams } from 'react-router-dom';
import { createContext, useContext } from 'react';

const UrlParamsIdContext = createContext<string>('');

export const useIdFromUrl = () => {
  const context = useContext(UrlParamsIdContext);

  if (context === undefined) {
    throw new Error('context is undefined');
  }

  return context;
};

export const IdFromUrlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const id = params.id;

  return <UrlParamsIdContext.Provider value={id}>{children}</UrlParamsIdContext.Provider>;
};

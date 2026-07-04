import { createContext, useContext } from 'react';
import type { AnalysesFeed } from './useAnalysesFeed';

// Один инстанс useAnalysesFeed() живёт в AnalysesPage и раздаётся вниз через этот
// контекст — так список (AnalysesSlide) и обложка-лоадер (AnalysesHero) читают
// одни и те же pending-строки, а `heroForSlide` в SwipeDeck остаётся стабильным
// (Hero берёт данные из контекста, а не из пропсов).
export const AnalysesFeedContext = createContext<AnalysesFeed | null>(null);

export function useAnalysesFeedContext(): AnalysesFeed {
  const ctx = useContext(AnalysesFeedContext);
  if (!ctx) {
    throw new Error(
      'useAnalysesFeedContext must be used within <AnalysesFeedContext.Provider>'
    );
  }
  return ctx;
}

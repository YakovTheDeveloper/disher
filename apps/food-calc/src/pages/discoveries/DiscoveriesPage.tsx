import { memo, useCallback, type Ref } from 'react';
import { SwipeDeck, type DeckSlide } from '@/shared/ui/SwipeDeck';
import { type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import DiscoveriesTopBar from './ui/DiscoveriesTopBar';
import HypothesesSlide from './ui/HypothesesSlide';
import InsightsSlide from './ui/InsightsSlide';

// /discoveries — «Открытия»: зонтик над гипотезами (что я проверяю) и инсайтами
// (что нашла LLM на разборах). Два РАЗДЕЛА = два настоящих Embla-слайда (как на
// Home/Dish) — переключение и тапом по плитке, и горизонтальным свайпом. Вся
// обвязка (плавающий бар + стекло + scroll-hide + свайп + плитки) живёт в общем
// `SwipeDeck`; страница отдаёт лишь бар и два слайда.
const SCREENS: ScreenEntry[] = [{ label: 'Гипотезы' }, { label: 'Инсайты' }];

const slides: DeckSlide[] = [
  { render: (topSlot) => <HypothesesSlide topSlot={topSlot} /> },
  { render: (topSlot) => <InsightsSlide topSlot={topSlot} /> },
];

const DiscoveriesPage = () => {
  const renderTopBar = useCallback(
    (shellRef: Ref<HTMLDivElement>) => <DiscoveriesTopBar shellRef={shellRef} />,
    []
  );

  return (
    <SwipeDeck
      screens={SCREENS}
      slides={slides}
      defaultSlide={0}
      renderTopBar={renderTopBar}
      tablistLabel="Открытия: раздел"
    />
  );
};

export default memo(DiscoveriesPage);

import { memo, useCallback, type Ref } from 'react';
import { SwipeDeck, type DeckSlide } from '@/shared/ui/SwipeDeck';
import { useWallpaperStore } from '@/shared/lib/wallpaper';
import { type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import AnalysesSlide from './ui/AnalysesSlide';
import InsightsSlide from './ui/InsightsSlide';
import HypothesesSlide from './ui/HypothesesSlide';
import AnalysesHero from './ui/AnalysesHero';
import AnalysesTopBar from './ui/AnalysesTopBar';
import { AnalysesFeedContext } from './model/AnalysesFeedContext';
import { useAnalysesFeed } from './model/useAnalysesFeed';

// /analyses — «Анализы»: три экрана общего `SwipeDeck` [Инсайты · Разборы ·
// Гипотезы]. Стартуем на среднем (Разборы, `defaultSlide=1`). Инсайты и Гипотезы
// мигрировали с бывшей страницы «Открытий» (та удалена). На среднем экране —
// hero-обложка (AnalysesHero), которая сменяется FabricLoader пока есть идущий
// разбор. Единый feed-хук (useAnalysesFeed) раздаётся через контекст, чтобы список
// и обложка-лоадер видели одни pending-строки, а `heroForSlide` оставался
// стабильным.
const SCREENS: ScreenEntry[] = [
  { label: 'Инсайты' },
  { label: 'Разборы' },
  { label: 'Гипотезы' },
];

const slides: DeckSlide[] = [
  { render: (topSlot) => <InsightsSlide topSlot={topSlot} /> },
  { render: (topSlot) => <AnalysesSlide topSlot={topSlot} /> },
  { render: (topSlot) => <HypothesesSlide topSlot={topSlot} /> },
];

// Стабильный (module-const): арт только на среднем экране; на 1/3 слот пуст, но
// высоту `--deck-hero-h` каркас всё равно резервирует → верхний отступ совпадает.
const heroForSlide = (i: number) => (i === 1 ? <AnalysesHero /> : null);

const AnalysesPage = () => {
  const feed = useAnalysesFeed();

  // Дек = один экран обоев «Разборы»; высота обложки одинакова на всех трёх
  // слайдах (Инсайты/Разборы/Гипотезы) → верхний отступ совпадает при свайпе.
  const analysesHeight = useWallpaperStore((s) => s.heights.analyses) ?? undefined;
  const heroHeightForSlide = useCallback(() => analysesHeight, [analysesHeight]);

  const renderTopBar = useCallback(
    (shellRef: Ref<HTMLDivElement>) => <AnalysesTopBar shellRef={shellRef} />,
    []
  );

  return (
    <AnalysesFeedContext.Provider value={feed}>
      <SwipeDeck
        screens={SCREENS}
        slides={slides}
        defaultSlide={1}
        renderTopBar={renderTopBar}
        heroForSlide={heroForSlide}
        heroHeightForSlide={heroHeightForSlide}
        tablistLabel="Анализы: раздел"
        arrowHint="all"
      />
    </AnalysesFeedContext.Provider>
  );
};

export default memo(AnalysesPage);

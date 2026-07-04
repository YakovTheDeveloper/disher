import { memo } from 'react';
import { modalStore, type BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionTile } from '@/shared/ui/atoms/ActionTile';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useDishAnalysis } from '../../api/queries';
import { useDishRun } from '../../model/runStore';
import { DishAnalysisModal } from '../DishAnalysisModal';
import styles from './DishHubDrawer.module.scss';

// Ghost art (public/art) — переиспользуем существующий PNG разбора дня; новых
// ассетов не заводим (см. инвариант плана).
const ANALYSIS_IMG = '/art/day-analysis.png';

type Props = BaseDrawerProps<void> & {
  dishId: string;
  hasIngredients: boolean;
  suggestDisabled: boolean;
  onSuggest: () => void;
};

// «О!»-хаб страницы блюда — зеркало AnalysisHubDrawer, но для блюда: две плитки
// («Анализировать блюдо» → модалка, «Предложить продукты» → drawer-подсказка).
// Свежий mount на каждое открытие через `drawerStore.show`, поэтому one-shot
// `useDishAnalysis` перечитывает idb-keyval корректно (реактивность hasAnalysis).
const DishHubDrawer = ({ dishId, hasIngredients, suggestDisabled, onSuggest, onClose }: Props) => {
  const online = useOnline();
  const { data: analysis } = useDishAnalysis(dishId);
  const run = useDishRun(dishId);

  const hasAnalysis = Boolean(analysis && (analysis.summary || analysis.insights.length > 0));
  const runInFlight = run?.status === 'loading';

  // Плитка активна, если разбор уже есть (посмотреть) ИЛИ идёт (открыть лоадер).
  // Иначе гейтим по возможности посчитать: нужны ингредиенты и сеть.
  const analysisDisabled = !hasAnalysis && !runInFlight && (!hasIngredients || !online);
  const analysisHint =
    hasAnalysis || runInFlight
      ? null
      : !online
        ? 'Нет сети — разбор недоступен'
        : !hasIngredients
          ? 'Добавьте хотя бы один ингредиент'
          : null;

  function openAnalysis() {
    onClose();
    void modalStore.show(DishAnalysisModal, { dishId, hasIngredients });
  }

  function suggest() {
    onClose();
    onSuggest();
  }

  return (
    <DrawerLayout title="Блюдо">
      <div className={styles.body}>
        <ActionTile
          emphasis
          top="Анализировать блюдо"
          bottom="AI-разбор профиля БЖУ и связок нутриентов"
          hint={analysisHint}
          art={<img src={ANALYSIS_IMG} alt="" />}
          disabled={analysisDisabled}
          onClick={openAnalysis}
        />
        <ActionTile
          top="Предложить продукты"
          bottom="Подобрать ингредиенты по названию блюда"
          disabled={suggestDisabled}
          onClick={suggest}
        />
      </div>
    </DrawerLayout>
  );
};

export default memo(DishHubDrawer);

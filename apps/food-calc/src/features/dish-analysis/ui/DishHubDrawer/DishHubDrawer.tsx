import { memo } from 'react';
import { modalStore, type BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionList } from '@/shared/ui/ActionList';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useDishAnalysis } from '../../api/queries';
import { useDishRun } from '../../model/runStore';
import { DishAnalysisModal } from '../DishAnalysisModal';
import ChartBarsIcon from '@/shared/assets/icons/chart-bars.svg?react';
import LupaIcon from '@/shared/assets/icons/lupa.svg?react';
import styles from './DishHubDrawer.module.scss';

type Props = BaseDrawerProps<void> & {
  dishId: string;
  hasIngredients: boolean;
  suggestDisabled: boolean;
  onSuggest: () => void;
};

// «О!»-хаб страницы блюда — зеркало AnalysisHubDrawer, но для блюда: два ряда
// SettingRow («Анализировать блюдо» → модалка, «Предложить продукты» → drawer-
// подсказка), делит тающая бровка (канон paper-mono). Свежий mount на каждое
// открытие через `drawerStore.show`, поэтому one-shot `useDishAnalysis`
// перечитывает idb-keyval корректно (реактивность hasAnalysis).
const DishHubDrawer = ({ dishId, hasIngredients, suggestDisabled, onSuggest, onClose }: Props) => {
  const online = useOnline();
  const { data: analysis } = useDishAnalysis(dishId);
  const run = useDishRun(dishId);

  const hasAnalysis = Boolean(analysis && (analysis.summary || analysis.insights.length > 0));
  const runInFlight = run?.status === 'loading';

  // Ряд активен, если разбор уже есть (посмотреть) ИЛИ идёт (открыть лоадер).
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
      {/* Ряды-действия SettingRow в одной секции ActionList (1:1 с AnalysisHubDrawer).
          Причина недоступности «Анализировать» (офлайн / нет ингредиентов) едет в
          `sub`. Секция без заголовка — он дублировал бы «Блюдо» из шапки. */}
      <ActionList>
        <ActionList.Section as="h3">
          <div className={styles.rows}>
            <SettingRow
              icon={<ChartBarsIcon width={18} height={18} />}
              label="Анализировать блюдо"
              sub={analysisDisabled ? (analysisHint ?? undefined) : 'AI-разбор профиля БЖУ и связок нутриентов'}
              trailing={<ChevronGlyph />}
              onClick={openAnalysis}
              disabled={analysisDisabled}
            />
            <SettingRow
              icon={<LupaIcon width={18} height={18} />}
              label="Предложить продукты"
              sub="Подобрать ингредиенты по названию блюда"
              trailing={<ChevronGlyph />}
              onClick={suggest}
              disabled={suggestDisabled}
            />
          </div>
        </ActionList.Section>
      </ActionList>
    </DrawerLayout>
  );
};

export default memo(DishHubDrawer);

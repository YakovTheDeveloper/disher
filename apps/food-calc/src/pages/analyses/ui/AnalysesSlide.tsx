import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { modalStore } from '@/shared/ui';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { AnalysisHubDrawer } from '@/features/analysis/AnalysisHubDrawer';
import Button from '@/shared/ui/atoms/Button/Button';
import { AiSparkleIcon } from '@/shared/ui/atoms/icons/AiSparkleIcon';
import { Select, type SelectOption } from '@/shared/ui/atoms/Select';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { type Analysis } from '@/features/analysis/api';
import {
  AnalysisListItem,
  AnalysisDetailModal,
  formatWindowLabel,
  windowSpanDays,
} from '@/features/analysis/long';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useAnalysesFeedContext } from '../model/AnalysesFeedContext';
import styles from './AnalysesSlide.module.scss';

// Средний экран /analyses (Разборы) — список разборов (дневные + длительные
// вперемешку, различает только окно). Данные — из общего feed-контекста (тот же
// инстанс кормит обложку-лоадер AnalysesHero); свежесозданная/перезапущенная
// строка вливается оптимистично через `addOptimistic`. `topSlot` (hero-полка
// каркаса) форвардится в `Screen stickyTop`.
type Props = { topSlot: ReactNode };

type Filter = 'all' | 'daily' | 'long';

// Дневной разбор = окно в 1 календарный день (windowStart === windowEnd). Один и
// тот же клиентский предикат делит список — бэк дневной/длительный не различает.
const isDaily = (a: Analysis): boolean =>
  windowSpanDays({ start: a.windowStart, end: a.windowEnd }) === 1;

const AnalysesSlide = ({ topSlot }: Props) => {
  const { t } = useTranslation();
  const { analyses, addOptimistic, deleteOne, loading, failedToLoad, refetch } =
    useAnalysesFeedContext();
  const [filter, setFilter] = useState<Filter>('all');

  // Опции селекта-фильтра. Полные подписи (не сокращения «Дневн.»/«Длительн.») —
  // селект показывает выбранный пункт как самостоятельную строку, а не в тесном
  // ряду чипов, поэтому есть место на человеческое слово.
  const filterOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: t('analyses.filter.all') },
      { value: 'daily', label: t('analyses.filter.daily') },
      { value: 'long', label: t('analyses.filter.long') },
    ],
    [t]
  );

  const visible = useMemo(() => {
    if (filter === 'all') return analyses;
    return analyses.filter((a) => (filter === 'daily' ? isDaily(a) : !isDaily(a)));
  }, [analyses, filter]);

  const openDetail = useCallback(
    async (id: string) => {
      const analysis = analyses.find((a) => a.id === id);
      if (!analysis) return;
      // The modal resolves with a fresh analysis when the user restarts a
      // stale/failed run — show it right away.
      const restarted = await modalStore.show(AnalysisDetailModal, { analysis });
      if (restarted) addOptimistic(restarted);
    },
    [analyses, addOptimistic]
  );

  // Long-press → per-row action drawer (canon: delete in the top-right chrome,
  // «Открыть разбор» as the primary action in the stack).
  const openActions = useCallback(
    (analysis: Analysis) => {
      void drawerStore.show(ItemActionsDrawer, {
        title: formatWindowLabel(analysis.windowStart, analysis.windowEnd),
        onDelete: () => deleteOne(analysis.id),
        actions: [{ label: t('analyses.openAnalysis'), onClick: () => openDetail(analysis.id) }],
      });
    },
    [deleteOne, openDetail, t]
  );

  // Одна кнопка «Новый разбор» → развилка день/период в AnalysisHubDrawer.
  // `date` = сегодня (для «Разобрать день»); хаб-дровер тот же, что открывает «О!»
  // на Home (там date = дата расписания).
  const openCreate = useCallback(() => {
    // Мы уже на странице открытий → скрываем нав-плитку «Страница открытий»
    // (она вела бы на себя же).
    void drawerStore.show(AnalysisHubDrawer, {
      date: format(new Date(), 'dd-MM-yyyy'),
      hideDiscoveriesLink: true,
    });
  }, []);

  // Плашка (raised dock plate) как на HomePage — `plate` красит бар surface-2 +
  // elevation-2 + скруглённой верхней кромкой; кнопка «Новый разбор» лежит НА ней.
  const bottomBar = (
    <AppBottomBarShell plate>
      <Button
        fullWidth
        icon={<AiSparkleIcon />}
        onClick={openCreate}
        onSurface={2}
        flat
        className={styles.newAnalysisCta}
      >
        {t('analyses.newAnalysis')}
      </Button>
    </AppBottomBarShell>
  );

  const empty = {
    title: t(`analyses.empty.list.${filter}.title`),
    description: t(`analyses.empty.list.${filter}.description`),
  };

  return (
    <Screen stickyTop={topSlot} headerOverlap topBarHide="settings" bottomBar={bottomBar}>
      <div className={styles.container}>
        {/* Фильтр Все / Дневные / Длительные — селект единственного выбора (общий
            атом Select на Base UI, тот же, что «способ измерения» в ProductDrawer).
            Локальный, лёгкий (чисто клиентский предикат по окну). Прижат вправо,
            без видимой подписи (опции самоочевидны; a11y держит ariaLabel).
            Прячем во время первичной загрузки/ошибки. */}
        {!loading && !failedToLoad && (
          <>
            <div className={styles.filter}>
              <Select
                ariaLabel={t('analyses.filter.label')}
                value={filter}
                options={filterOptions}
                onChange={(next) => setFilter(next as Filter)}
              />
            </div>
            {/* Фирменная тающая линия под фильтром (canon Divider) с небольшим
                воздухом сверху/снизу — отделяет фильтр от списка разборов. */}
            <div className={styles.filterDivider} aria-hidden="true" />
          </>
        )}

        {loading ? (
          <div className={styles.centered}>
            <Spinner />
          </div>
        ) : failedToLoad ? (
          <EmptyState
            className={styles.empty}
            title={t('analyses.empty.loadFailed.title')}
            description={t('analyses.empty.loadFailed.description')}
            action={
              <Button variant="system-secondary" onClick={() => refetch()}>
                {t('analyses.retry')}
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            className={styles.empty}
            title={empty.title}
            description={empty.description}
          />
        ) : (
          <div className={styles.listWrap}>
            <ul className={styles.listBody}>
              {visible.map((a) => (
                <AnalysisListItem
                  key={a.id}
                  analysis={a}
                  onOpen={openDetail}
                  onLongPress={openActions}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Screen>
  );
};

export default memo(AnalysesSlide);

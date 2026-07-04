import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { modalStore } from '@/shared/ui';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { AnalysisHubDrawer } from '@/features/analysis/AnalysisHubDrawer';
import Button from '@/shared/ui/atoms/Button/Button';
import { AiSparkleIcon } from '@/shared/ui/atoms/icons/AiSparkleIcon';
import { Chip } from '@/shared/ui/atoms/Chip';
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

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'daily', label: 'Дневн.' },
  { key: 'long', label: 'Длительн.' },
];

const EMPTY_COPY: Record<Filter, { title: string; description: string }> = {
  all: {
    title: 'Разборов пока нет',
    description:
      'Разбор смотрит на твою еду, события и выбранные гипотезы — за день или за 1–5 недель. Запусти первый кнопкой «Новый разбор».',
  },
  daily: {
    title: 'Дневных разборов пока нет',
    description:
      'Разбор дня смотрит на одну дату — еду и события за неё. Запусти его кнопкой «Новый разбор».',
  },
  long: {
    title: 'Длительных разборов пока нет',
    description:
      'Длительный разбор смотрит на 1–5 недель сразу. Запусти его кнопкой «Новый разбор».',
  },
};

const AnalysesSlide = ({ topSlot }: Props) => {
  const { analyses, addOptimistic, deleteOne, loading, failedToLoad, refetch } =
    useAnalysesFeedContext();
  const [filter, setFilter] = useState<Filter>('all');

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
        actions: [{ label: 'Открыть разбор', onClick: () => openDetail(analysis.id) }],
      });
    },
    [deleteOne, openDetail]
  );

  // Одна кнопка «Новый разбор» → развилка день/период в AnalysisHubDrawer.
  // `date` = сегодня (для «Разобрать день»); хаб-дровер тот же, что открывает «О!»
  // на Home (там date = дата расписания).
  const openCreate = useCallback(() => {
    void drawerStore.show(AnalysisHubDrawer, { date: format(new Date(), 'dd-MM-yyyy') });
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
        Новый разбор
      </Button>
    </AppBottomBarShell>
  );

  const empty = EMPTY_COPY[filter];

  return (
    <Screen stickyTop={topSlot} headerOverlap topBarHide="settings" bottomBar={bottomBar}>
      <div className={styles.container}>
        {/* Фильтр Все / Дневные / Длительные — чипы единственного выбора (атом
            Chip, как во флоу создания еды / порциях). Локальный, лёгкий (чисто
            клиентский предикат по окну). Лежат на листе Screen (headerOverlap =
            surface-1) → surface={1}. Селект-скин `outline` (второй скин Chip):
            покой приподнят (elevation), выбранный — плоский + ink-рамка + жирнее
            текст, БЕЗ butter-заливки. Прячем во время первичной загрузки/ошибки. */}
        {!loading && !failedToLoad && (
          <>
            <div className={styles.filter} role="group" aria-label="Фильтр разборов">
              {FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  surface={1}
                  variant="outline"
                  active={filter === f.key}
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Chip>
              ))}
            </div>
            {/* Фирменная тающая линия под фильтром (canon Divider) с небольшим
                воздухом сверху/снизу — отделяет чипы от списка разборов. */}
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
            title="Не удалось загрузить"
            description="Список разборов не подгрузился — проверь сеть."
            action={
              <Button variant="system-secondary" onClick={() => refetch()}>
                Повторить
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

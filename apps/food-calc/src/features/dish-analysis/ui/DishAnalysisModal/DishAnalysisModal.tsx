import { memo, useEffect } from 'react';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { HeaderDeleteButton } from '@/shared/ui/ModalHeader';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Typography';
import { AnalysisResult } from '@/features/analysis/AnalysisResult';
import { FabricLoader } from '@/features/analysis/FabricLoader';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useDishAnalysis } from '../../api/queries';
import { deleteDishAnalysis } from '../../api/storage';
import { useDishRun, useDishRunStore } from '../../model/runStore';
import s from './DishAnalysisModal.module.scss';

type Props = BaseModalProps<void> & {
  dishId: string;
  hasIngredients: boolean;
};

// Модалка «Анализ» блюда — точка входа из DishHubDrawer. In-flight живёт в
// module-scope runStore (переживает закрытие модалки), персист — idb-keyval
// (useDishAnalysis). Свежий mount на каждое открытие через `modalStore.show`,
// поэтому one-shot `useDishAnalysis` перечитывает idb-keyval корректно.
const DishAnalysisModal = ({ dishId, hasIngredients, onClose }: Props) => {
  const online = useOnline();
  const { data: persisted, isLoading } = useDishAnalysis(dishId);
  const run = useDishRun(dishId);
  const start = useDishRunStore((st) => st.start);
  const clear = useDishRunStore((st) => st.clear);

  // Контент: свежий результат запуска приоритетнее персиста; иначе — персист,
  // если в нём реально есть разбор (summary или инсайты).
  const persistedContent =
    persisted && (persisted.summary || persisted.insights.length > 0)
      ? { summary: persisted.summary, insights: persisted.insights }
      : null;
  const content =
    run?.status === 'done' && run.result
      ? { summary: run.result.summary, insights: run.result.insights }
      : persistedContent;
  const hasContent = Boolean(content);

  // Авто-запуск на открытии: нет персиста, нет запущенного разбора, есть
  // ингредиенты и сеть → считаем. Плитка гейтит вход, так что этот путь = «можно
  // считать». start идемпотентен, а условие снимается сразу после старта (run
  // становится truthy), поэтому второго POST не будет.
  useEffect(() => {
    if (isLoading) return;
    if (hasContent || run || !hasIngredients || !online) return;
    void start(dishId);
  }, [isLoading, hasContent, run, hasIngredients, online, start, dishId]);

  const handleDelete = async () => {
    // Молча (без confirm): удалить персист + сбросить runStore + закрыть.
    await deleteDishAnalysis(dishId);
    clear(dishId);
    onClose();
  };

  // Урна — только когда контент реально есть и НЕ идёт загрузка (нельзя удалить
  // недосчитанное).
  const showTrash = hasContent && run?.status !== 'loading';

  // Лоадер: активный запуск ИЛИ первичная гидрация idb (пока не знаем, есть ли
  // персист) — чтобы не мигал «пусто» перед показом кэша.
  const loading = run?.status === 'loading' || (isLoading && !hasContent);

  return (
    <ModalLayout a11yLabel="Анализ блюда">
      <ModalShell>
        <ModalShell.Header
          title="Анализ"
          onBack={() => onClose()}
          trailing={
            showTrash ? (
              <HeaderDeleteButton onClick={handleDelete} label="Удалить анализ" />
            ) : undefined
          }
        />
        <ModalShell.Body>
          {loading ? (
            // Реальный запуск → «Разбираем блюдо»; первичная гидрация idb (чтение
            // кэша) → нейтральная подпись, чтобы не врать «считаем».
            <FabricLoader
              art="/art/loader-analysis.png"
              caption={run?.status === 'loading' ? 'Разбираем блюдо' : 'Загрузка'}
            />
          ) : hasContent && content ? (
            // Контент выигрывает у error: если разбор уже есть, провалившийся
            // «Перезапустить» показывается ИНЛАЙНОМ над кнопкой, не подменяя экран
            // (иначе готовый разбор пропал бы из виду до успешного повтора).
            <>
              <AnalysisResult
                summary={content.summary}
                observations={[]}
                insights={content.insights}
                hypotheses={[]}
                insightSource="dish"
                showDays={false}
                sheetHeader="Результат"
              />
              {run?.status === 'error' && (
                <Text role="body" className={`${s.error} ${s.errorInline}`}>
                  {run.error ?? 'Не удалось перезапустить разбор'}
                </Text>
              )}
              <Button
                variant="accent"
                className={s.rerun}
                onClick={() => void start(dishId)}
                disabled={!online || !hasIngredients}
              >
                Перезапустить разбор
              </Button>
            </>
          ) : run?.status === 'error' ? (
            // Ошибка без существующего контента (первый запуск не удался) —
            // полноэкранное состояние + «Повторить».
            <div className={s.stateBlock}>
              <Text role="body" className={s.error}>
                {run.error ?? 'Не удалось разобрать блюдо'}
              </Text>
              <Button
                variant="accent"
                onClick={() => void start(dishId)}
                disabled={!online || !hasIngredients}
              >
                Повторить
              </Button>
            </div>
          ) : (
            <div className={s.stateBlock}>
              <Text role="body">Разбор пока не готов.</Text>
            </div>
          )}
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default memo(DishAnalysisModal);

import { RouterLinks } from '@/router';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '@/api/trpc/trpc';
import { getSnapshot } from 'mobx-state-tree';
import { domainStore } from '@/store/store';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { Button } from '@/components/ui/atoms/Button';
import styles from './ScheduleFoodAnalyticsPage.module.scss';
import { useDishStore, useFoodScheduleStore } from '@/app/stores/helpers';
import { ScheduleFoodsType } from '@/domain/schedule/scheduleFood/ScheduleFoods.model';
import toaster from '@/infrastructure/toaster/toaster';

interface AnalyzeScheduleSnapshot {
  id: string;
  foods: Array<{
    id: string;
    time: string;
    contentProduct: {
      foodId: string;
      variant: 'product';
      quantity: number;
    } | null;
    contentDish: {
      dishId: string;
      variant: 'dish';
      quantity: number;
    } | null;
  }>;
}

const Page = observer(({ scheduleFood }: { scheduleFood: ScheduleFoodsType }) => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatScheduleForAI = () => {
    const snapshot = getSnapshot(scheduleFood);
    const items = snapshot.foods.items;

    if (items.length === 0) {
      return 'Нет данных о питании';
    }

    const lines = items.map((item) => {
      const time = item.time;
      let name = '';
      let quantity = 0;

      if (item.contentProduct) {
        const food = domainStore.foodStore.getEntity(item.contentProduct.foodId);
        name = food?.name ?? 'Неизвестный продукт';
        quantity = item.contentProduct.quantity;
      } else if (item.contentDish) {
        const dish = domainStore.dishStore.getEntity(item.contentDish.dishId);
        name = dish?.name ?? 'Неизвестное блюдо';
        quantity = item.contentDish.quantity;
      }

      return `${time} - ${name}: ${quantity}г`;
    });

    return lines.join('\n');
  };

  const handleCopyToClipboard = async () => {
    const scheduleText = formatScheduleForAI();
    const prompt = `Проанализируй день:\n\n${scheduleText}`;

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(prompt);
        return;
      } catch (err) {
        console.warn('Clipboard API failed, trying fallback:', err);
      }
    }

    // Fallback for iOS Safari and older browsers
    const textarea = document.createElement('textarea');
    textarea.value = prompt;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const success = document.execCommand('copy');
      toaster.success('Скопировано!');
      if (!success) {
        console.error('Fallback copy failed');
      }
    } catch (err) {
      console.error('Fallback copy error:', err);
      toaster.success('Ошибка копирования!');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = getSnapshot(scheduleFood);

      const transformedSnapshot: AnalyzeScheduleSnapshot = {
        id: snapshot.id,
        foods: snapshot.foods.items.map((item) => ({
          id: item.id,
          time: item.time,
          contentProduct: item.contentProduct
            ? {
                foodId: item.contentProduct.foodId,
                variant: 'product' as const,
                quantity: item.contentProduct.quantity,
              }
            : null,
          contentDish: item.contentDish
            ? {
                dishId: item.contentDish.dishId,
                variant: 'dish' as const,
                quantity: item.contentDish.quantity,
              }
            : null,
        })),
      };

      const result = await trpc.analyzeSchedule.mutate({
        snapshot: transformedSnapshot,
      });

      if (result.data) {
        setAnalysisResult(result.data);
      } else if (result.message) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scheduleFood.foods.items.length > 0) {
      handleAnalyze();
    }
  }, [scheduleFood]);

  return (
    <Screen title={<ScreenLabel variant="screenHeader">Аналитика питания</ScreenLabel>}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="ghost" onClick={handleCopyToClipboard}>
            СКОПИРОВАТЬ
          </Button>
        </div>

        {isLoading && <div className={styles.loading}>Анализируем рацион...</div>}

        {error && <div className={styles.error}>{error}</div>}

        {analysisResult && <div className={styles.result}>{analysisResult}</div>}

        {!isLoading && !analysisResult && !error && (
          <div className={styles.empty}>
            Нет данных для анализа. Добавьте продукты в расписание.
          </div>
        )}
      </div>
    </Screen>
  );
});

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();

  const scheduleFoodStore = useFoodScheduleStore();

  const foodSchedule = scheduleFoodStore.getLocal(date || '');

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.ScheduleDateSelection);
    }
  }, [date]);

  if (!foodSchedule) return null;
  if (!date) return null;

  return <Page scheduleFood={foodSchedule} />;
};

export default GetDatePageWrapper;

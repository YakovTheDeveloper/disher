import { useEffect, useRef, useState } from 'react';
import { useStore } from '@livestore/react';
import { useParams } from 'react-router';
import { fetchShare } from '@/shared/lib/api/shares';
import {
  SuggestionsReviewList,
} from '@/features/dish/suggest-products';
import type { SuggestionsReviewListRef, SuggestionItem } from '@/features/dish/suggest-products';
import { addDishItem } from '@/entities/dish';
import { addScheduleFood } from '@/entities/schedule-food';
import { Button } from '@/shared/ui/atoms/Button';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { SearchFood } from '@/features/food/food-search';
import { ScheduleSelection } from '@/features/ScheduleSelection/ScheduleSelection';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { RouterUrls, RouterLinks } from '@/app/router';
import { useNavigate } from 'react-router';
import styles from './ShareReceivePage.module.scss';

type ShareData = {
  items: SuggestionItem[];
  source: { type: 'dish' | 'day'; name: string };
  senderName?: string;
  createdAt: string;
};

type Mode = 'review' | 'select-dish' | 'select-date';

const ShareReceivePage = () => {
  const { store } = useStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listRef = useRef<SuggestionsReviewListRef>(null);

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('review');
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));

  useEffect(() => {
    if (!id) return;
    fetchShare(id)
      .then((d) => {
        setData(d);
        setStatus('done');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        setStatus('error');
      });
  }, [id]);

  const getItems = () => listRef.current?.getResultedItems() ?? [];

  const handleAddToDish = async (payload: { variant: 'product' | 'dish'; id: string }) => {
    const items = getItems();
    if (items.length === 0) {
      toaster.error('Нет продуктов для добавления');
      return;
    }

    const dishId = payload.id;
    const result = await safeMutate(
      () => Promise.all(items.map((item) => addDishItem(store, { dishId, foodId: item.foodId, quantity: item.quantity }))),
      'Не удалось добавить продукты',
    );
    if (result === undefined) return;

    toaster.success(`Добавлено ${items.length} продуктов`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
    navigate(RouterUrls.getDish(dishId));
  };

  const handleAddToDay = async (date: string) => {
    const items = getItems();
    if (items.length === 0) {
      toaster.error('Нет продуктов для добавления');
      return;
    }

    const result = await safeMutate(
      () => Promise.all(items.map((item) =>
        addScheduleFood(store, { date, time, type: 'food', quantity: item.quantity, foodId: item.foodId })
      )),
      'Не удалось добавить продукты',
    );
    if (result === undefined) return;

    toaster.success(`Добавлено ${items.length} продуктов на ${date}`, {
      action: { label: 'Открыть', href: `${RouterLinks.ScheduleBuilder}/${date}` },
    });
    navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
  };

  if (status === 'loading') {
    return (
      <div className={styles.center}>
        <Spinner size={24} />
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className={styles.center}>
        <p className={styles.error}>{error ?? 'Ссылка не найдена'}</p>
      </div>
    );
  }

  if (mode === 'select-dish') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setMode('review')}>
            ←
          </button>
          <span className={styles.title}>Выберите блюдо</span>
        </div>
        <SearchFood onSelectFood={handleAddToDish} mode="dishes-only" />
      </div>
    );
  }

  if (mode === 'select-date') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setMode('review')}>
            ←
          </button>
          <span className={styles.title}>Выберите дату и время</span>
        </div>
        <div className={styles.content}>
          <TimeChoose onFinish={setTime} initialTime={time} />
          <ScheduleSelection onSelect={handleAddToDay} />
        </div>
      </div>
    );
  }

  const sourceLabel =
    data.source.type === 'dish'
      ? `Продукты из блюда «${data.source.name}»`
      : `Продукты за ${data.source.name}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>{sourceLabel}</span>
      </div>
      {data.senderName && (
        <p className={styles.sender}>От: {data.senderName}</p>
      )}
      <div className={styles.content}>
        <SuggestionsReviewList ref={listRef} items={data.items} />
        <div className={styles.actions}>
          <Button variant="primary-form" onClick={() => setMode('select-dish')}>
            Добавить в блюдо
          </Button>
          <Button variant="secondary" onClick={() => setMode('select-date')}>
            Добавить в день
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareReceivePage;

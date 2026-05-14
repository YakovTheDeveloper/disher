import { useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { SuggestionsReviewList } from '@/features/dish/suggest-products';
import type { SuggestionsReviewListRef, SuggestionItem } from '@/features/dish/suggest-products';
import { addDishItem } from '@/entities/dish';
import { addScheduleFood } from '@/entities/schedule-food';
import { useProductsByIds } from '@/entities/product/api/queries';
import { Button } from '@/shared/ui/atoms/Button';
import { SearchFood } from '@/features/food/food-search';
import { ScheduleNavigator } from '@/features/schedule-navigator';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { RouterUrls, RouterLinks } from '@/app/router';
import styles from './ShareReceivePage.module.scss';

type Mode = 'review' | 'select-dish' | 'select-date';

type ParsedEntry = { id: string; quantity: number };

function parseShareParam(raw: string | null): ParsedEntry[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((chunk) => {
      const [id, qty] = chunk.split(':');
      if (!id) return null;
      const quantity = Number(qty);
      return { id, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 100 };
    })
    .filter((x): x is ParsedEntry => x !== null);
}

const ShareReceivePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const listRef = useRef<SuggestionsReviewListRef>(null);

  const entries = useMemo(() => parseShareParam(searchParams.get('p')), [searchParams]);
  const products = useProductsByIds(entries.map((e) => e.id));

  const items = useMemo<SuggestionItem[]>(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return entries
      .map((e) => {
        const product = byId.get(e.id);
        if (!product) return null;
        return { productId: e.id, name: product.name, quantity: e.quantity };
      })
      .filter((x): x is SuggestionItem => x !== null);
  }, [entries, products]);

  const [mode, setMode] = useState<Mode>('review');
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));

  const getItems = () => listRef.current?.getResultedItems() ?? [];

  const handleAddToDish = async (payload: { variant: 'product' | 'dish'; id: string }) => {
    const picked = getItems();
    if (picked.length === 0) {
      toaster.error('Нет продуктов для добавления');
      return;
    }

    const dishId = payload.id;
    const result = await safeMutate(
      () =>
        Promise.all(
          picked.map((item) =>
            addDishItem({ dishId, productId: item.productId, quantity: item.quantity })
          )
        ),
      'Не удалось добавить продукты'
    );
    if (!result.ok) return;

    toaster.success(`Добавлено ${picked.length} продуктов`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
    navigate(RouterUrls.getDish(dishId));
  };

  const handleAddToDay = async (date: string) => {
    const picked = getItems();
    if (picked.length === 0) {
      toaster.error('Нет продуктов для добавления');
      return;
    }

    const result = await safeMutate(
      () =>
        Promise.all(
          picked.map((item) =>
            addScheduleFood({
              date,
              time,
              type: 'food',
              quantity: item.quantity,
              productId: item.productId,
            })
          )
        ),
      'Не удалось добавить продукты'
    );
    if (!result.ok) return;

    toaster.success(`Добавлено ${picked.length} продуктов на ${date}`, {
      action: { label: 'Открыть', href: `${RouterLinks.ScheduleBuilder}/${date}` },
    });
    navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
  };

  if (entries.length === 0) {
    return (
      <div className={styles.center}>
        <p className={styles.error}>Ссылка пуста</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.center}>
        <p className={styles.error}>Продукты не найдены</p>
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
          <ScheduleNavigator onSelect={handleAddToDay} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>Продукты по ссылке</span>
      </div>
      <div className={styles.content}>
        <SuggestionsReviewList ref={listRef} items={items} />
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

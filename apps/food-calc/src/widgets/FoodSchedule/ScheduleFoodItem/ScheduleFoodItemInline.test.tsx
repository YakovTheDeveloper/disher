import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ScheduleFoodItemInline from './ScheduleFoodItemInline';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import cardStyles from '@/shared/ui/atoms/Card/Card.module.scss';
import cardTimeStyles from '@/shared/ui/atoms/CardTime/CardTime.module.scss';
import rowStyles from '@/features/shared/long-press-item/LongPressRow.module.scss';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';

// Регресс-детектор show-stopper'а «время правят не в том файле»: время карточки
// ЕДЫ рендерится через node-escape <CardTime> (его `.display`-класс), НЕ через
// текстовый `.time`-путь Card.module.scss (тот бьёт только событие — ScheduleEventCard
// с `Card.Time htmlFor/onTap`). Если кто-то снова стилизует время в Card.module.scss
// `.time`, думая что чинит еду, — этот тест краснеет.
const item: ScheduleFoodWithRelations = {
  id: 'sf-1',
  date: '2026-06-27',
  time: '23:31',
  type: 'food',
  quantity: 100,
  details: 'с кожурой',
  productId: 'p-1',
  dishId: null,
  createdAt: '2026-06-27T00:00:00.000Z',
  product: { name: 'Курага', isUserCreated: false },
  dish: null,
};

describe('ScheduleFoodItemInline — раскладка времени', () => {
  it('время несёт класс из CardTime.module.scss, а не из Card.module.scss .time', () => {
    render(<ScheduleFoodItemInline item={item} />);

    // formatClock("23:31") → "23:31" (ведущего нуля у часа нет).
    const time = screen.getByText('23:31');

    expect(time).toHaveClass(cardTimeStyles.display);
    expect(time).not.toHaveClass(cardStyles.time);
  });
});

// Паритет еда↔события (части 1+2): только что добавленная ЕДА получает recent-
// маркер через тот же recentlyAddedStore, что и события — синий кружок + разовый
// flash фона несёт класс `.row_recent` на подложке (LongPressRow). Триггер — id
// в store (по образцу события), НЕ index → мигает ТОЛЬКО добавленный ряд, список
// не переигрывается. Тест гоняет реальную цепочку store → ScheduleFoodItemInline
// → FoodEntryCard → Card.Root → LongPressRow.
describe('ScheduleFoodItemInline — recent-маркер (паритет с событиями)', () => {
  afterEach(() => {
    useRecentlyAddedStore.getState().clear();
  });

  it('несёт .row_recent (recent-dot + flash), когда id ряда в recentlyAddedStore', () => {
    useRecentlyAddedStore.getState().addMany([item.id]);
    const { container } = render(<ScheduleFoodItemInline item={item} />);
    const row = container.querySelector('li') as HTMLLIElement;
    expect(row).toHaveClass(rowStyles.row_recent);
  });

  it('НЕ помечает ряд, которого нет в store — flash только у добавленного, не у всего списка', () => {
    useRecentlyAddedStore.getState().addMany(['some-other-id']);
    const { container } = render(<ScheduleFoodItemInline item={item} />);
    const row = container.querySelector('li') as HTMLLIElement;
    expect(row).not.toHaveClass(rowStyles.row_recent);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ScheduleFoodItemInline from './ScheduleFoodItemInline';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import cardStyles from '@/shared/ui/atoms/Card/Card.module.scss';
import cardTimeStyles from '@/shared/ui/atoms/CardTime/CardTime.module.scss';
import rowStyles from '@/features/shared/long-press-item/LongPressRow.module.scss';
import { markAdded, takeJustAdded } from '@/shared/model/recentlyAddedStore';

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

// Just-added flash (consume-once mailbox, 2026-07-04): только что добавленная ЕДА
// получает класс `.row_recent` на подложке (LongPressRow), когда её id лежит в
// mailbox (markAdded). Читается РАЗ на маунте (isJustAdded в useState-инициализаторе)
// → мигает ТОЛЬКО добавленный ряд, список не переигрывается. Тест гоняет реальную
// цепочку mailbox → ScheduleFoodItemInline → FoodEntryCard → Card.Root → LongPressRow.
describe('ScheduleFoodItemInline — just-added flash (mailbox)', () => {
  afterEach(() => {
    // Ящик — module-level Set: вычищаем возможные хвосты между кейсами.
    takeJustAdded(item.id);
    takeJustAdded('some-other-id');
  });

  it('несёт .row_recent (flash), когда id ряда в mailbox', () => {
    markAdded([item.id]);
    const { container } = render(<ScheduleFoodItemInline item={item} />);
    const row = container.querySelector('li') as HTMLLIElement;
    expect(row).toHaveClass(rowStyles.row_recent);
  });

  it('НЕ помечает ряд, которого нет в mailbox — flash только у добавленного, не у всего списка', () => {
    markAdded(['some-other-id']);
    const { container } = render(<ScheduleFoodItemInline item={item} />);
    const row = container.querySelector('li') as HTMLLIElement;
    expect(row).not.toHaveClass(rowStyles.row_recent);
  });
});

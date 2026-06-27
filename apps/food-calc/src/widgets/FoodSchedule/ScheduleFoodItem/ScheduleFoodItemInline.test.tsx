import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ScheduleFoodItemInline from './ScheduleFoodItemInline';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import cardStyles from '@/shared/ui/atoms/Card/Card.module.scss';
import cardTimeStyles from '@/shared/ui/atoms/CardTime/CardTime.module.scss';

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

import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { FoodEntryCard } from './FoodEntryCard';
import cardStyles from '@/shared/ui/atoms/Card/Card.module.scss';

// FoodEntryCard рисует скелет [qty-столбик][имя+детали][время?]. Card.Qty — ЛЕВЫЙ
// столбик с ХОЛОДНЫМ числовым голосом (`.qtyCol` несёт --sys-color-text-on-hue-card),
// имя — тёплый ink в `.content`. Тесты страхуют, что qty-слот реально отрисован
// (регресс «Card.Root не нашёл Card.Qty по cardSlot» → пустой столбик) и что число
// сидит в холодном столбике, а имя — в тёплом контенте (цвет-Вариант-1).

afterEach(cleanup);

// <li> (LongPressRow) оборачиваем в <ul> — без DOM-nesting warning.
function renderCard() {
  render(
    <ul>
      <FoodEntryCard
        id="fe-1"
        quantity={150}
        unit="г"
        onCommitQuantity={vi.fn()}
        name={{ name: 'Айва' }}
      />
    </ul>
  );
}

describe('FoodEntryCard — qty-столбик', () => {
  it('рендерит количество в холодном qty-столбике (.qtyCol), вне контента', () => {
    renderCard();

    // EditableQuantity рендерит значение редактируемым input'ом (textbox). Времени
    // нет → это единственный textbox, промаха нет.
    const qtyInput = screen.getByRole('textbox') as HTMLInputElement;
    expect(qtyInput).toHaveValue('150');

    expect(qtyInput.closest(`.${cardStyles.qtyCol}`)).not.toBeNull();
    expect(qtyInput.closest(`.${cardStyles.content}`)).toBeNull();
  });

  it('имя лежит в тёплом контент-столбике (.content), вне qty-столбика', () => {
    renderCard();

    const name = screen.getByText('Айва');
    expect(name.closest(`.${cardStyles.content}`)).not.toBeNull();
    expect(name.closest(`.${cardStyles.qtyCol}`)).toBeNull();
  });
});

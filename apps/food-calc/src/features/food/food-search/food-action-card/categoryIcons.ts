import fruitIcon from '@icons/product/fruit.png';
import vegetableIcon from '@icons/product/vegetable.png';

// Маппинг категории продукта → иконка
// Добавляй сюда новые иконки по мере появления PNG в shared/assets/icons/product/
const CATEGORY_ICON_MAP: Partial<Record<string, string>> = {
  fruit: fruitIcon,
  vegetable: vegetableIcon,
};

/**
 * Возвращает URL первой найденной иконки для набора категорий.
 * Приоритет определяется порядком итерации Set.
 */
export function getCategoryIcon(categories: Set<string> | null | undefined): string | null {
  if (!categories) return null;
  for (const cat of categories) {
    const icon = CATEGORY_ICON_MAP[cat];
    if (icon) return icon;
  }
  return null;
}

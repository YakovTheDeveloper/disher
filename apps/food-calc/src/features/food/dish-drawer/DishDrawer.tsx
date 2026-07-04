import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { useDishWithStatus, useDishItemsWithProducts, useDishNutrientTotals } from '@/entities/dish';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { IconButton } from '@/shared/ui/atoms/Button';
import { Heading, Text, Numeral } from '@/shared/ui/atoms/Typography';
import { useViewTransitionNavigate } from '@/shared/lib/viewTransition';
import { RouterUrls } from '@/app/router';
import type { BaseDrawerProps } from '@/shared/ui';
import s from './DishDrawer.module.scss';

interface Props extends BaseDrawerProps {
  dishId: string;
  /** Имя для мгновенной шапки, пока блюдо грузится из Dexie (опционально). */
  dishName?: string;
}

// Стрелка «на страницу блюда» — inline glyph, currentColor (наследует холодный
// `--sys-color-icon` слота topRight). Право-указывающая (переход вперёд).
const ArrowRightGlyph = () => (
  <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true">
    <path
      d="M3.5 9h10M9.5 5l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Боковой дровер блюда — read-only превью, зеркало ProductDrawer. Открывается из
 * SearchFood / расписания вместо перехода на страницу `/dish/:id`. Оверлей не
 * размонтирует HomePage, поэтому скролл SearchFood и открытая модалка поиска
 * сохраняются сами собой (симметрия с продуктом). Показывает состав (ингредиенты)
 * + суммарные нутриенты блюда. Стрелка в правом углу обвязки ведёт на полную
 * страницу блюда (осознанный «нырок» в редактирование) — перед навигацией дровер
 * закрывается явно, иначе он остался бы в стеке drawerStore над новым роутом.
 *
 * Открытие: `drawerStore.show(DishDrawer, { dishId, dishName }, { side: 'left', width: 'min(85vw, 360px)' })`.
 */
export function DishDrawer({ dishId, dishName, onClose }: Props) {
  const { dish, loading } = useDishWithStatus(dishId);
  const items = useDishItemsWithProducts(dishId);
  const totals = useDishNutrientTotals(dishId);

  const heroName = dish?.name ?? dishName;
  // Та же раскадровка 'push', что и dish-инфо из FoodActionCard: новая страница
  // въезжает справа. state.heroName даёт DishPage показать имя сразу.
  const goToPage = useViewTransitionNavigate(RouterUrls.getDish(dishId), 'push', {
    state: { heroName },
  });
  const handleOpenPage = () => {
    onClose();
    goToPage();
  };

  const displayName = heroName ? capitalize(heroName) : undefined;

  const pageArrow = (
    <IconButton
      aria-label="Открыть страницу блюда"
      icon={<ArrowRightGlyph />}
      onClick={handleOpenPage}
    />
  );

  if (loading) {
    // Блюдо грузится из Dexie (useLiveQuery → undefined первый тик). Имя-«призрак»
    // из dishName в родной обвязке DrawerLayout, пока не подъедет реальная строка.
    return (
      <DrawerLayout
        title={displayName}
        subtitle="блюдо"
        a11yLabel={dishName ?? 'Блюдо'}
        contentInset="panel"
        topRight={pageArrow}
      >
        <div className={s.body} />
      </DrawerLayout>
    );
  }

  if (!dish) {
    // Блюдо не найдено: удалено (на этом или другом устройстве до мёржа тумбстоуна)
    // либо осиротевший schedule-ряд. Раньше это был вечно-пустой ghost со стрелкой
    // на /dish/:id несуществующего блюда — тупик. Показываем тихое сообщение и
    // убираем стрелку topRight (вести некуда).
    return (
      <DrawerLayout
        title={displayName}
        subtitle="блюдо"
        a11yLabel={dishName ?? 'Блюдо'}
        contentInset="panel"
      >
        <div className={s.body}>
          <Text as="p" role="caption" className={s.empty}>
            Блюдо не найдено — возможно, оно было удалено
          </Text>
        </div>
      </DrawerLayout>
    );
  }

  return (
    <DrawerLayout
      title={displayName}
      subtitle="блюдо"
      a11yLabel={dish.name}
      contentInset="panel"
      topRight={pageArrow}
    >
      <div className={s.body}>
        <section className={s.section}>
          <Heading as="span" role="title">Состав</Heading>
          {items.length > 0 ? (
            <ul className={s.ingredients}>
              {items.map((it) => (
                <li key={it.id} className={s.ingredientRow}>
                  <Text as="span" role="body" className={s.ingredientName}>
                    {it.product?.name ? capitalize(it.product.name) : 'Продукт'}
                  </Text>
                  <Numeral as="span" size="sm" className={s.ingredientQty}>
                    {Math.round(it.quantity)}
                    <Text as="span" role="caption" className={s.ingredientUnit}> г</Text>
                  </Numeral>
                </li>
              ))}
            </ul>
          ) : (
            <Text as="p" role="caption" className={s.empty}>
              В блюде пока нет ингредиентов
            </Text>
          )}
        </section>

        {/* Суммарные нутриенты блюда (сумма ингредиентов) — read-only, тот же
            NutrientTable-разбор, что и в ProductDrawer, через общий FoodsNutrients
            (норма-кнопка сверху + таблица). Гейтим по наличию ингредиентов: у
            пустого блюда totals = {} → таблица нулей + «Моя норма» читались бы как
            «есть профиль из нулей». Пусто → только empty-state состава выше. */}
        {items.length > 0 && <FoodsNutrients totals={totals} />}
      </div>
    </DrawerLayout>
  );
}

export default DishDrawer;

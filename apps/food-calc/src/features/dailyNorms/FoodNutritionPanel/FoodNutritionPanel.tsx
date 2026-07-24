import { memo, type ReactNode } from 'react';
import { NutrientMeterView } from '@/entities/nutrient/ui/NutrientMeterView';
import { FoodNormSections } from '@/features/dailyNorms/FoodNormSections';
import { FoodDrawerType } from '@/shared/ui/FoodDrawerType';
import { Text } from '@/shared/ui/atoms/Typography/Text';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import styles from './FoodNutritionPanel.module.scss';

type Props = {
  /** Содержание нутриента (обычно скейленное по количеству/сумме). */
  getValue: (nutrientId: string) => number;
  /**
   * Тип еды («Мой продукт» / «Продукт» / «Блюдо») — ряд-шапка панели ПОД хедером
   * дровера: тип слева, `composition`-контрол справа (`FoodDrawerType`). Пусто →
   * ряда нет (консумеры без типа, напр. NutrientsDrawer).
   */
  type?: string;
  /**
   * Контрол основы количества (Select способа измерения / текст «На одну единицу»)
   * — правый слот ряда типа. Опционален: read-only сумма (блюдо/день) основы не
   * имеет, а без `type` рисовать негде.
   */
  composition?: ReactNode;
  /**
   * Контент МЕЖДУ секциями нормы и мерой нутриентов (напр. поле ручного ввода
   * граммов у продукта в custom-режиме). Дефолт — ничего.
   */
  children?: ReactNode;
  missingNutrientNames?: string[];
  isLoading?: boolean;
  /**
   * Инсет контента секций «Дневная норма»/«Нутриенты» на --sys-inset-page слева
   * (лейбл заподлицо, контент вдвинут). Opt-in дроверов еды (запрос 2026-07-19);
   * прочие консумеры (NutrientsDrawer) остаются заподлицо.
   */
  insetContent?: boolean;
};

/**
 * Общий Nutrients-разбор еды: ряд типа еды (`type` слева + `composition`-контрол
 * справа, `FoodDrawerType`) → секция «Дневная норма» → мера нутриентов
 * (NutrientMeterView). Панель владеет всей шапкой разбора, включая ряд типа
 * (запрос 2026-07-19): консумер отдаёт `type` + `composition`, а не рисует их сам.
 * Продукт зовёт напрямую (getScaledValue + селект основы + поле граммов), блюдо и
 * день — через FoodsNutrients (totals → getValue). Выделено из дублей
 * ProductDrawer / FoodsNutrients (запрос 2026-07-19).
 */
const FoodNutritionPanel = ({
  getValue,
  type,
  composition,
  children,
  missingNutrientNames = [],
  isLoading,
  insetContent,
}: Props) => (
  <div className={styles.root}>
    {isLoading && (
      <div className={styles.spinnerOverlay}>
        <Spinner size={16} />
      </div>
    )}
    <FoodDrawerType type={type} trailing={composition} />
    <FoodNormSections
      insetContent={insetContent}
      nutrients={
        <>
          {children}
          <NutrientMeterView getValue={getValue} />
          {missingNutrientNames.length > 0 && (
            <Text role="caption" className={styles.missing}>
              Нет данных о нутриентах: {missingNutrientNames.join(', ')}
            </Text>
          )}
        </>
      }
    />
  </div>
);

export default memo(FoodNutritionPanel);

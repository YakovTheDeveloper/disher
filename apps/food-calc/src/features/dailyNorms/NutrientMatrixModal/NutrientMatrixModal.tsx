import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { Text } from '@/shared/ui/atoms/Typography';
import { GaugeFill, NormFigure } from '@/shared/ui/NormGauge';
import { type BaseModalProps } from '@/shared/ui';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useDishItemsByDishIds } from '@/entities/dish';
import { useNutrientsByProductIds, useBasisByProductIds } from '@/entities/product';
// Норма юзера — через @x-public-API daily-norm (тот же путь, что useNutrientReadout).
import { useUserNormItems } from '@/entities/daily-norm/@x/nutrient';
import {
  nutrientDisplayGroups,
  nutrientsHaveDailyNorm,
  defaultDailyNorms,
  nutrientRowName,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientName } from '@/entities/nutrient/ui/NutrientName';
import {
  calculateProductNutrients,
  calculateDishNutrients,
  type NutrientTotals,
} from '@/shared/lib/nutrients';
import { formatNutrientMass, formatPctDisplay } from '@/shared/lib/formatNumber';
import { formatClock } from '@/shared/lib/time/formatClock';
import { capitalizeFirst } from '@/shared/lib/text/capitalizeFirst';
import s from './NutrientMatrixModal.module.scss';

type MatrixColumn = {
  key: string;
  name: string;
  /** Время приёма (HH:mm) — тихая подпись под именем колонки. */
  time: string;
  totals: NutrientTotals;
};

type MatrixRow = {
  id: string;
  name: string;
  subName?: string;
  /** Юнит нутриента (г / мг / мкг / ккал) — для массы в ячейке. */
  unit: string;
};

type MatrixGroup = {
  name: string;
  rows: MatrixRow[];
};

interface NutrientMatrixModalProps extends BaseModalProps {
  /** День расписания (YYYY-MM-DD) — матрица считается по его позициям. */
  date: string;
}

/**
 * Матрица «позиции дня × нутриенты»: колонка — продукт/блюдо из расписания,
 * ячейка — % суточной нормы, который даёт ЭТА позиция (без суммирования).
 * Та же математика на позицию, что `useScheduleNutrientTotals`, но тоталы
 * НЕ складываются — каждая колонка хранит свою карту.
 *
 * Ряд показывается, только когда у нутриента есть реальная норма (юзерская или
 * дефолтная — резолв как в `useNutrientReadout`) И хотя бы одна колонка даёт
 * > 0. Заливка ячейки — доля нормы, визуально капнутая на 100 % (число честное).
 */
const NutrientMatrixModal = ({ onClose, date }: NutrientMatrixModalProps) => {
  const { t } = useTranslation();
  const sfItems = useScheduleFoods(date);
  const userItems = useUserNormItems();

  const foodItems = sfItems.filter((sf) => sf.type === 'food' && sf.productId);
  const dishItems = sfItems.filter((sf) => sf.type === 'dish' && sf.dishId);

  const dishIds = [...new Set(dishItems.map((d) => d.dishId!))];
  const allDishItems = useDishItemsByDishIds(dishIds);

  const allProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fi of foodItems) if (fi.productId) ids.add(fi.productId);
    for (const di of allDishItems) ids.add(di.productId);
    return [...ids];
  }, [foodItems, allDishItems]);

  const nutrientsMap = useNutrientsByProductIds(allProductIds);
  const basisMap = useBasisByProductIds(allProductIds);

  const dataKey = sfItems
    .map((sf) => `${sf.id}:${sf.quantity}:${sf.type}:${sf.productId}:${sf.dishId}:${sf.time}`)
    .join('|');

  const columns = useMemo<MatrixColumn[]>(() => {
    const cols: MatrixColumn[] = [];
    for (const fi of foodItems) {
      const nutrients = nutrientsMap.get(fi.productId!);
      cols.push({
        key: fi.id,
        name: fi.product?.name ?? fi.productId!,
        time: fi.time,
        totals:
          nutrients && nutrients.length > 0
            ? calculateProductNutrients(nutrients, fi.quantity, basisMap.get(fi.productId!) ?? '100g')
            : {},
      });
    }
    for (const di of dishItems) {
      const diItems = allDishItems.filter((item) => item.dishId === di.dishId!);
      cols.push({
        key: di.id,
        name: di.dish?.name ?? di.dishId!,
        time: di.time,
        totals:
          diItems.length > 0
            ? calculateDishNutrients(
                diItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                nutrientsMap,
                di.quantity,
              )
            : {},
      });
    }
    return cols;
    // dataKey несёт изменения позиций/количеств; карты — стабильные ссылки из Dexie-хуков.
  }, [dataKey, allDishItems, nutrientsMap, basisMap]);

  // Без ручного useMemo: компилятор мемоизирует сам, а зависимость от
  // кастомно-мемоизированных `columns` (deps через dataKey) ломала бы preserve
  // (react-compiler: "memoization could not be preserved").
  // Пока нормы не приехали из IDB — не рисуем ряды на дефолтах (мигнёт),
  // тот же принцип `hasNormRow` в useNutrientReadout.
  const groups: MatrixGroup[] =
    userItems == null
      ? []
      : nutrientDisplayGroups
          .map((group) => ({
            name: group.displayName,
            rows: group.content
              .filter((n) => {
                const numId = Number(n.id);
                const norm = userItems[n.id] ?? defaultDailyNorms[numId] ?? 0;
                if (nutrientsHaveDailyNorm[numId] !== true || norm <= 0) return false;
                return columns.some((c) => (c.totals[n.id] ?? 0) > 0);
              })
              .map((n) => ({
                id: n.id,
                // «к» вместо «ккал» — только в матрице (узкие колонки), глобально
                // unitRu энергии не трогаем.
                unit: n.id === '7' ? 'к' : n.unitRu,
                // short: у витаминов «B1» вместо «Витамин B1» (узкая колонка);
                // дровер зовёт nutrientRowName без short и не меняется.
                ...nutrientRowName(n.id, { short: true }),
              })),
          }))
          .filter((group) => group.rows.length > 0);

  const normOf = (id: string): number =>
    userItems?.[id] ?? defaultDailyNorms[Number(id)] ?? 0;

  const title = t('nutrientMatrix.title', 'Продукты × нутриенты');
  const loading = userItems == null;

  return (
    <ModalLayout a11yLabel={title}>
      <ModalShell contentPadding="none">
        <ModalShell.Header title={title} onBack={onClose} />
        <ModalShell.Body>
          {columns.length === 0 && !loading ? (
            <Text as="p" role="body" className={s.empty}>
              {t('nutrientMatrix.empty', 'Нет продуктов за этот день')}
            </Text>
          ) : loading ? (
            <Text as="p" role="caption" className={s.empty}>
              {t('nutrientMatrix.loading', 'Загрузка…')}
            </Text>
          ) : (
            <div
              className={s.scroller}
              tabIndex={0}
              role="region"
              aria-label={t('nutrientMatrix.regionLabel', 'Таблица нутриентов по позициям дня')}
            >
              <table className={s.table}>
                <caption className={s.visuallyHidden}>
                  {t(
                    'nutrientMatrix.caption',
                    'Процент суточной нормы каждого нутриента от каждого продукта или блюда дня',
                  )}
                </caption>
                {/* fixed-layout: ширины колонок — единый источник истины здесь
                    (первая 6.5rem под имена нутриентов, позиции строго 5.5ch). */}
                <colgroup>
                  <col className={s.colFirst} />
                  {columns.map((c) => (
                    <col key={c.key} className={s.colFood} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className={s.corner}>
                      <span className={s.visuallyHidden}>
                        {t('nutrientMatrix.nutrientColumn', 'Нутриент')}
                      </span>
                    </th>
                    {columns.map((c) => (
                      <th key={c.key} scope="col">
                        <Text as="span" role="body" className={s.colHeadName}>
                          {capitalizeFirst(c.name)}
                        </Text>
                        <Text as="span" role="caption" className={s.colHeadTime}>
                          {formatClock(c.time)}
                        </Text>
                      </th>
                    ))}
                  </tr>
                </thead>
                {groups.map((group, gi) => (
                  // Группа = свой tbody (семантика rowgroup): шапка-ряд на всю
                  // ширину + ряды нутриентов. Пустые группы уже отфильтрованы.
                  <tbody key={group.name}>
                    <tr>
                      {/* Шапка группы — как `.rowHeadLeft` дровера (caption,
                          tertiary); у первой группы верхнего зазора нет. Прилеплена
                          к левой кромке, как первая колонка: colSpan на всю ширину,
                          sticky-left лишь держит её левый край при гориз. скролле. */}
                      <th
                        colSpan={columns.length + 1}
                        scope="rowgroup"
                        className={clsx(s.groupHead, gi === 0 && s.groupHeadFirst)}
                      >
                        <Text as="span" role="caption" className={s.groupHeadText}>
                          {group.name}
                        </Text>
                      </th>
                    </tr>
                    {group.rows.map((row) => {
                      const norm = normOf(row.id);
                      return (
                        <tr key={row.id}>
                          <th scope="row" className={s.rowHead}>
                            <NutrientName name={row.name} subName={row.subName} flush className={s.rowHeadName} />
                          </th>
                          {columns.map((c) => {
                            const value = c.totals[row.id] ?? 0;
                            const pctRaw = norm > 0 ? Math.min((value / norm) * 100, 999) : 0;
                            // Нулевая позиция — тире без заливки и без процента,
                            // та же доктрина, что у карточки поиска.
                            return (
                              <td key={c.key} className={s.cell}>
                                <GaugeFill level={Math.min(pctRaw, 100) / 100} />
                                <NormFigure
                                  className={s.cellFigure}
                                  value={value > 0 ? formatNutrientMass(value, row.unit) : null}
                                  unit={row.unit}
                                  pct={value > 0 ? formatPctDisplay(pctRaw) : null}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>
          )}
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default NutrientMatrixModal;

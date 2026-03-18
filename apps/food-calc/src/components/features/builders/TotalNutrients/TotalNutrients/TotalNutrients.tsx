import styles from './TotalNutrients.module.scss';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';
import { OpenDailyNorms } from '@/components/features/dailyNorms/OpenDailyNorms';
import { Ornament } from '@/components/ui/Ornament';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import type { NutrientTotals } from '@/shared/lib/nutrients';

type Props = {
  children: React.ReactNode;
  totals: NutrientTotals;
  foodWithNoNutrients?: { id: string }[];
  customItems?: { name: string }[];
};

const TotalNutrients = ({ totals, children, foodWithNoNutrients = [], customItems }: Props) => {
  const { getValue } = useNutrientTotals(totals);

  return (
    <>
      <Ornament text="нутриенты"></Ornament>
      <Nutrients
        renderCard={(nutrientData) => (
          <NutrientCardV2
            content={nutrientData}
            getValue={getValue}
          />
        )}
      />
      <OpenDailyNorms />

      {children}

      {foodWithNoNutrients.length > 0 && (
        <div className={styles.messageContainer}>
          <p>Без продуктов</p>
          <div className={styles.messageContainerRow}>
            {foodWithNoNutrients.map((food) => (
              <span key={food.id}>{food.id}</span>
            ))}{' '}
          </div>
          <p>(нет данных по ценности)</p>
        </div>
      )}

      {customItems?.length && (
        <div className={styles.messageContainer}>
          <p>Расчет производится без учета кастомных продуктов</p>
          <div className={styles.messageContainerRow}>
            Продукты:{' '}
            {customItems.map(({ name }) => (
              <span key={name}>{name}</span>
            ))}{' '}
          </div>
          <p>не были учтены</p>
        </div>
      )}
    </>
  );
};

export default TotalNutrients;

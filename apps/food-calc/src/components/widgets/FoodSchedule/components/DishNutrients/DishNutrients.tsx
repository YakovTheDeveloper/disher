import styles from './DishNutrients.module.scss';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';
import clsx from 'clsx';
import type { ScheduleFood } from '@/entities/schedule-food';
import type { Dish } from '@/entities/dish';
import { Button } from '@/components/ui/atoms/Button';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import type { NutrientTotals } from '@/shared/lib/nutrients';

type Props = {
  currentChild: ScheduleFood;
  currentDish: Dish;
  totals: NutrientTotals;
};

const DishNutrients = ({ currentChild, currentDish, totals }: Props) => {
  const { getValue } = useNutrientTotals(totals);

  // TODO: migrate to Triplit — content was MST computed property
  const childAny = currentChild as any;
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => childAny.content?.updateQuantity?.(+e.target.value);

  return (
    <div className={styles.container}>
      <header className={styles.tabs}>
        <div
          className={clsx(styles.tab, {
            [styles.active]: true,
          })}
          onClick={() => {}}
        >
          {currentDish.name}
        </div>
        <div>
          <input type="number" onChange={onChange} value={childAny.quantity ?? ''} />
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.content}>
          <Nutrients
            renderCard={(nutrientData) => (
              <NutrientCardV2
                content={nutrientData}
                getValue={getValue}
              />
            )}
          />
          <Button
            variant="ghost"
            className={styles.link}
            onClick={() => {
              // TODO: implement daily norm chooser with drawerStore.show()
            }}
          >
            поменять норму
          </Button>
        </div>
        <nav className={styles.items}>
          {/* TODO: migrate to Triplit — currentDish.items was MST relation */}
        </nav>
      </div>
    </div>
  );
};

export default DishNutrients;

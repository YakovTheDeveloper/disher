import styles from './Nutrients.module.scss';
import { nutrientGroups, Nutrient, getNutrientColumn } from '@/components/entities/nutrient/NutrientGroup/constants';
import clsx from 'clsx';

interface Props {
  renderCard: (nutrientData: Nutrient) => React.ReactNode;
}

const Nutrients = ({ renderCard }: Props) => {
  return (
    <div className={clsx([styles.container])}>
      {nutrientGroups.map(({ content, displayName: groupName }) => {
        const column1 = content.filter((n) => getNutrientColumn(n.id) === 1);
        const column2 = content.filter((n) => getNutrientColumn(n.id) === 2);

        return (
          <div key={groupName} className={styles.group}>
            <h3 className={styles.groupTitle}>{groupName}</h3>
            <div className={clsx([styles.groupContent])}>
              <div className={clsx(styles.column, styles.columnFirst)}>
                {column1.map((nutrientData) => (
                  <div key={nutrientData.id}>{renderCard(nutrientData)}</div>
                ))}
              </div>
              <div className={clsx(styles.column, styles.columnShifted)}>
                {column2.map((nutrientData) => (
                  <div key={nutrientData.id}>{renderCard(nutrientData)}</div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Nutrients;

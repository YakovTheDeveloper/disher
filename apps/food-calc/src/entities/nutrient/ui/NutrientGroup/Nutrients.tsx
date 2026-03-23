import styles from './Nutrients.module.scss';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import React from 'react';
import clsx from 'clsx';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';

interface Props {
  renderCard: (nutrientData: Nutrient) => React.ReactNode;
}

const Nutrients = ({ renderCard }: Props) => {
  return (
    <div className={styles.container}>
      {nutrientGroups.map(({ content, displayName: groupName, name }) => {
        const headline = groupName.toUpperCase();
        return (
          <div key={groupName} className={clsx(styles.group, styles[`group--${name}`])}>
            <h2 className={styles.groupTitle}>
              <span className={styles.groupTitleBold}>{headline}</span>
            </h2>
            <div className={styles.groupContent}>
              {content.map((nutrientData) => (
                <React.Fragment key={nutrientData.id}>{renderCard(nutrientData)}</React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Nutrients;

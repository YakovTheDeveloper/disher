import styles from './Nutrients.module.scss';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import React from 'react';
import clsx from 'clsx';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import treeSrc from '@/shared/assets/decarative/tree2.png';

interface Props {
  renderCard: (nutrientData: Nutrient) => React.ReactNode;
  excludeGroups?: string[];
}

const Nutrients = ({ renderCard, excludeGroups }: Props) => {
  const groups = excludeGroups
    ? nutrientGroups.filter(g => !excludeGroups.includes(g.name))
    : nutrientGroups;
  return (
    <div className={styles.container}>
      {groups.map(({ content, displayName: groupName, name }) => {
        const headline = groupName.toUpperCase();
        return (
          <div key={groupName} className={clsx(styles.group, styles[`group--${name}`])}>
            {/* {name === 'main' && (
              <img src={treeSrc} alt="" className={styles.treeBackground} />
            )} */}
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

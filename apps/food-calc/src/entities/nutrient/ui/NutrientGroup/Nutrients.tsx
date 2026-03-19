import styles from './Nutrients.module.scss';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import React from 'react';
import clsx from 'clsx';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import treeSrc from '@/assets/decarative/tree.png';
import tree2Src from '@/assets/decarative/tree2.png';

interface Props {
  renderCard: (nutrientData: Nutrient) => React.ReactNode;
}

const Nutrients = ({ renderCard }: Props) => {
  return (
    <div className={clsx([styles.container])}>
      {nutrientGroups.map(({ content, displayName: groupName }) => {
        return (
          <div key={groupName} className={styles.group}>
            <div className={clsx([styles.groupContent])}>
              {/* <h2 className={styles.groupTitle}>{groupName}</h2> */}
              {content.map((nutrientData) => (
                <React.Fragment key={nutrientData.id}>{renderCard(nutrientData)}</React.Fragment>
              ))}
              {content[0]?.group === 'main' && (
                <img src={treeSrc} alt="" className={styles.decorativeImg} />
              )}
              {content[0]?.group === 'rest' && (
                <img src={tree2Src} alt="" className={styles.decorativeImgLarge} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Nutrients;

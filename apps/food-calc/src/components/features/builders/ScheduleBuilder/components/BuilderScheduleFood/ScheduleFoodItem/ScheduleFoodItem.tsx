import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodItem.module.scss';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { domainStore } from '@/store/store';
import { useNavigate, useParams } from 'react-router';
import { RouterLinks } from '@/router';

import { ScheduleItem } from '@/domain/schedule/schedule.model';
import { Instance } from 'mobx-state-tree';

type Props = {
  className?: string;
  item: Instance<typeof ScheduleItem>;
};

const ScheduleFoodItem = ({ item, className }: Props) => {
  const navigate = useNavigate();
  const { id: date } = useParams();
  const id = item.id;
  const content = item.content;

  console.log('content:', content);

  const onFoodsOpenUpdate = () => {
    navigate(`${RouterLinks.ScheduleFood}/${date}?id=${id}`);
  };

  const onQuantityOpen = () => {
    navigate(`${RouterLinks.ScheduleFood}/${date}?id=${id}`);
  };

  const getVariantLabelText = () => {
    if (content?.variant === 'product') {
      if (content.isCustom) return 'кастом';
      else return 'продукт';
    }
    if (content?.variant === 'dish') return 'блюдо';

    return '';
  };

  const getFoodNameClassName = () => {
    const prefix = content?.variant;
    if (!prefix) return '';
    return styles[`${prefix}Title`];
  };

  const afterName = useMemo(() => {
    return <p className={styles.variant}>{getVariantLabelText()}</p>;
  }, [content]);

  return (
    <CommonListItem className={clsx([className, styles.group])} id={id} sync={item.sync}>
      <FoodName content={content} className={getFoodNameClassName()} onClick={onFoodsOpenUpdate} />
      <Quantity id={id} onClick={onQuantityOpen} content={content} />
      {afterName}
    </CommonListItem>
  );
};

export default observer(ScheduleFoodItem);

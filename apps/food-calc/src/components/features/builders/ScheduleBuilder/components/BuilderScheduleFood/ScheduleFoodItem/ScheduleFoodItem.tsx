import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodItem.module.scss';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { domainStore } from '@/store/store';

import { ScheduleItem } from '@/domain/schedule/schedule.model';
import { Instance } from 'mobx-state-tree';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';

type Props = {
  className?: string;
  item: Instance<typeof ScheduleItem>;
};

const ScheduleFoodItem = ({ item, className }: Props) => {
  const modals = domainStore.globalUiStore.modalStore;
  const id = item.id;
  const content = item.content;

  console.log('content:', content);

  const onFoodsOpenUpdate = () => {
    modals.openModal(ModalType.SCHEDULE_FOOD_EDIT, {
      defaultTab: 'foodChange',
      itemToEditId: id,
    });
  };

  const onQuantityOpen = () => {
    modals.openModal(ModalType.SCHEDULE_FOOD_EDIT, {
      defaultTab: 'quantity',
      itemToEditId: id,
    });
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

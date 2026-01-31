import { observer } from 'mobx-react-lite';
import styles from './ScheduleListItem.module.scss';
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

const ScheduleListItem = ({ item, className }: Props) => {
  const modals = domainStore.globalUiStore.modalStore;
  const id = item.id;

  const onFoodsOpenUpdate = () => {
    modals.openModal(ModalType.SCHEDULE_FOOD_EDIT, {
      defaultTab: 'foodSelect',
      itemToEditId: id,
    });
  };

  const onQuantityOpen = () => {
    modals.openModal(ModalType.SCHEDULE_FOOD_EDIT, {
      defaultTab: 'quantity',
      itemToEditId: id,
    });
  };

  const getFoodName = useCallback(() => item.content?.name, [item]);
  const getQuantity = useCallback(() => item.quantity, [item]);

  const getVariantLabelText = () => {
    if (item.content?.variant === 'product') {
      if (item.content.isCustom) return 'кастом';
      else return 'продукт';
    }
    if (item.content?.variant === 'dish') return 'блюдо';

    return '';
  };

  const getFoodNameClassName = () => {
    const prefix = item.type;
    return styles[`${prefix}Title`];
  };

  const afterName = useMemo(() => {
    return <p className={styles.variant}>{getVariantLabelText()}</p>;
  }, [item.content]);

  return (
    <CommonListItem className={clsx([className, styles.group])} id={id} sync={item.sync}>
      <FoodName
        content={item.content}
        className={getFoodNameClassName()}
        onClick={onFoodsOpenUpdate}
      >
        {getFoodName}
      </FoodName>
      <Quantity id={id} onClick={onQuantityOpen}>
        {getQuantity}
      </Quantity>
      {afterName}
    </CommonListItem>
  );
};

export default observer(ScheduleListItem);

import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import { BaseDrawerProps } from '@/shared/ui';
import { drawerStore } from '@/shared/ui/drawer-store';
import { AddProductToDayScheduleOverlay } from '@/components/features/daySchedule/add-product-to-day-schedule/AddProductToDayScheduleOverlay';
import { AddDishToDayScheduleOverlay } from '@/components/features/daySchedule/add-dish-to-day-schedule/AddDishToDayScheduleOverlay';
import { AddProductToDishOverlay } from '@/components/features/dish/add-product-to-dish/AddProductToDishOverlay';
import { FoodSetCostModal } from '@/components/features/food/food-set-cost-modal';
import { modalStore } from '@/shared/ui/modal-store';
import styles from './FoodActionsDrawer.module.scss';

interface Props extends BaseDrawerProps {
  variant: 'product' | 'dish';
  itemId: string;
  itemName: string;
  isUserCreated: boolean;
}

const FoodActionsDrawer = ({ onClose, variant, itemId, itemName, isUserCreated }: Props) => {
  const handleAddToSchedule = () => {
    onClose();
    if (variant === 'product') {
      drawerStore.show(AddProductToDayScheduleOverlay, { productId: itemId });
    } else {
      drawerStore.show(AddDishToDayScheduleOverlay, { dishId: itemId });
    }
  };

  const handleAddToDish = () => {
    onClose();
    drawerStore.show(AddProductToDishOverlay, { productId: itemId });
  };

  const handleSetCost = async () => {
    // TODO: get entity from Triplit query instead of domainStore
    onClose();
    const result = await modalStore.show(FoodSetCostModal, {
      itemName,
      currentPrice: 0,
      currentPerGrams: 100,
    });
    if (result) {
      // TODO: update cost via Triplit mutation
    }
  };

  const handleDelete = () => {
    // TODO: delete via Triplit mutation
    onClose();
  };

  const typeLabel = variant === 'product' ? 'Продукт' : 'Блюдо';
  const ownerLabel = isUserCreated ? ' \u00B7 ваше' : '';

  return (
    <DrawerLayout>
      <div className={styles.header}>
        <span className={styles.name}>{itemName}</span>
        <span className={styles.meta}>{typeLabel}{ownerLabel}</span>
      </div>
      <div className={styles.actions}>
        {variant === 'product' && (
          <button type="button" className={styles.actionBtn} onClick={handleAddToDish}>
            <AddToDishIcon />
            Добавить в блюдо
          </button>
        )}
        <button type="button" className={styles.actionBtn} onClick={handleAddToSchedule}>
          <AddToScheduleIcon />
          Добавить в расписание
        </button>
        <button type="button" className={styles.actionBtn} onClick={handleSetCost}>
          <CostIcon />
          Установить стоимость
        </button>
        {isUserCreated && (
          <button type="button" className={styles.actionBtn_danger} onClick={handleDelete}>
            <TrashIcon />
            Удалить {variant === 'product' ? 'продукт' : 'блюдо'}
          </button>
        )}
      </div>
    </DrawerLayout>
  );
};

const AddToDishIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AddToScheduleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CostIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 9.5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2c-1.1 0-2 .9-2 2s.9 2 2 2h2c1.1 0 2-.9 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default FoodActionsDrawer;

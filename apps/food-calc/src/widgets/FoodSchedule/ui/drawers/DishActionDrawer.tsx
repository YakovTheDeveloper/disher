import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { BaseDrawerProps } from '@/shared/ui';
import { MODAL_INPUT_IDS } from '../ScheduleFoodCreationModals';
import styles from './DishActionDrawer.module.scss';

interface Props extends BaseDrawerProps {
  onCreateDish: () => void;
  onCopyToExisting: () => void;
}

const DishActionDrawer = ({ onClose, onCreateDish, onCopyToExisting }: Props) => {
  const handleCreateDish = () => {
    onClose();
    onCreateDish();
  };

  const handleCopyToExisting = () => {
    onClose();
    onCopyToExisting();
  };

  return (
    <DrawerLayout>
      <div className={styles.header}>
        <span className={styles.name}>В блюдо</span>
      </div>
      <div className={styles.actions}>
        <label htmlFor={MODAL_INPUT_IDS.DISH_NAME_INPUT} className={styles.actionBtn} onClick={handleCreateDish}>
          <NewDishIcon />
          В новое блюдо
        </label>
        <label htmlFor={MODAL_INPUT_IDS.SEARCH_INPUT} className={styles.actionBtn} onClick={handleCopyToExisting}>
          <ExistingDishIcon />
          В существующее блюдо
        </label>
      </div>
    </DrawerLayout>
  );
};

const NewDishIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ExistingDishIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default DishActionDrawer;

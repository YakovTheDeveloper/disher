import { PopoverTrigger } from '@/components/ui/popover/PopoverTrigger';
import styles from './OpenFoodCreation.module.scss';

type CreationType = 'product' | 'dish' | null;

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

type Props = {
  onSelect: (type: CreationType) => void;
  productInputId: string;
  dishInputId: string;
};

const OpenFoodCreation = ({ onSelect, productInputId, dishInputId }: Props) => {
  return (
    <PopoverTrigger
      placement="bottom-end"
      trigger={
        <button className={styles.plusBtn} type="button" aria-label="Создать">
          <PlusIcon />
        </button>
      }
      content={
        <div className={styles.popoverContent}>
          <label
            className={styles.popoverAction}
            htmlFor={productInputId}
            onClick={() => onSelect('product')}
          >
            Создать продукт
          </label>
          <label
            className={styles.popoverAction}
            htmlFor={dishInputId}
            onClick={() => onSelect('dish')}
          >
            Создать блюдо
          </label>
        </div>
      }
    />
  );
};

export default OpenFoodCreation;

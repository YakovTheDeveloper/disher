import styles from './Quantity.module.scss';
import { useAnimationOnChange } from '@/components/features/builders/shared/hooks/useAnimationOnChange';

type Props = {
  id: string | number;
  onClick: (id: string | number) => void;
  className?: string;
  hide: boolean;
  unit: string;
  content: { quantity: number } | null;
};

const Quantity = ({ id, onClick, content, hide, unit = 'г' }: Props) => {
  const quantity = content?.quantity || null;
  const className = useAnimationOnChange(quantity);

  const onClickHandler = () => onClick(id);
  return (
    <label
      htmlFor="quantity-input"
      onClick={onClickHandler}
      className={`${styles.container} ${hide ? styles.hide : ''} ${className}`}
    >
      {quantity}
      {quantity != null && <span className={styles.unit}>{unit}.</span>}
    </label>
  );
};

export default Quantity;

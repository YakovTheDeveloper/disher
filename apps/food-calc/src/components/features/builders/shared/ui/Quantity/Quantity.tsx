import { observer } from 'mobx-react-lite';
import styles from './Quantity.module.scss';
import { spy } from 'mobx';
import { useAnimationOnChange } from '@/components/features/builders/shared/hooks/useAnimationOnChange';
import {
  FoodContentDishInstance,
  FoodContentProductInstance,
} from '@/domain/shared/foodContent/foodContent';
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
    <p
      onClick={onClickHandler}
      className={`${styles.container} ${hide ? styles.hide : ''} ${className}`}
    >
      {quantity}
      {quantity != null && <span className={styles.unit}>{unit}.</span>}
    </p>
  );
};

export default observer(Quantity);

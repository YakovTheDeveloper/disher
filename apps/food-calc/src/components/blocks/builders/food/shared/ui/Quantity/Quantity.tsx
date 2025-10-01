import { observer } from 'mobx-react-lite';
import styles from './Quantity.module.scss';
import { spy } from 'mobx';
import { useAnimationOnChange } from '@/components/blocks/builders/food/shared/hooks/useAnimationOnChange';
type Props = {
  children: () => React.ReactNode;
  id: string | number;
  onClick: (id: string | number) => void;
  className?: string;
  hide: boolean;
  unit: string;
};

const Quantity = ({ id, onClick, children, hide, unit = 'г' }: Props) => {
  console.log('LIST_ITEM_QUANTIY');

  const className = useAnimationOnChange(children());

  const onClickHandler = () => onClick(id);
  return (
    <p
      onClick={onClickHandler}
      className={`${styles.container} ${hide ? styles.hide : ''} ${className}`}
    >
      {children()}
      <span className={styles.unit}>{unit}.</span>
    </p>
  );
};

export default observer(Quantity);

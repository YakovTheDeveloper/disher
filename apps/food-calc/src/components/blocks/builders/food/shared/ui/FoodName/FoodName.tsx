import { observer } from 'mobx-react-lite';
import styles from './FoodName.module.scss';
import clsx from 'clsx';
type Props = {
  children: string;
  onClick: () => void;
  hintMode: boolean;
  className: string;
};

const FoodName = ({ className, children, onClick, hintMode }: Props) => {
  return (
    <p className={clsx([styles.container, className, hintMode && styles.active])} onClick={onClick}>
      {children}
    </p>
  );
};

export default observer(FoodName);

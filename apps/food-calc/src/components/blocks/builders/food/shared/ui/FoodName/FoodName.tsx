import { observer } from 'mobx-react-lite';
import styles from './FoodName.module.scss';
import clsx from 'clsx';
type Props = {
  children: string;
  onClick: () => void;
  onClickHintModeOn: () => void;
  hintMode: boolean;
  className: string;
};

const FoodName = ({ className, children, onClick, onClickHintModeOn, hintMode }: Props) => {
  return (
    <p
      className={clsx([styles.container, className, hintMode && styles.active])}
      onClick={hintMode ? onClickHintModeOn : onClick}
    >
      {children}
    </p>
  );
};

export default observer(FoodName);

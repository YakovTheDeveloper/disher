import { observer } from 'mobx-react-lite';
import styles from './FoodName.module.scss';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
type Props = {
  children: () => string | null;
  onClick: (id: string | number) => void;
  onClickHintModeOn: (id: string | number) => void;
  hintMode: boolean;
  className?: string;
  id?: number | string;
};

const FoodName = ({ className, children, onClick, onClickHintModeOn, hintMode, id }: Props) => {
  const handleClick = () => {
    if (!id) return;
    if (hintMode) {
      onClickHintModeOn(id);
      return;
    }
    onClick(id);
  };
  return (
    <p
      className={clsx([styles.container, className, hintMode && styles.active])}
      onClick={handleClick}
    >
      {children()}
    </p>
  );
};

export default observer(FoodName);

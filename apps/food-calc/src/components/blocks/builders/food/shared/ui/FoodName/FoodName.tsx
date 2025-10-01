import { observer } from 'mobx-react-lite';
import styles from './FoodName.module.scss';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { useAnimationOnChange } from '@/components/blocks/builders/food/shared/hooks/useAnimationOnChange';
type Props = {
  children: () => string | null;
  onClick: (id: string | number) => void;
  onClickHintModeOn: (id: string | number) => void;
  after?: React.ReactNode;
  hintMode: boolean;
  className?: string;
  id?: number | string;
};

const FoodName = ({
  className,
  children,
  onClick,
  onClickHintModeOn,
  hintMode,
  id,
  after,
}: Props) => {
  const handleClick = () => {
    if (hintMode) {
      onClickHintModeOn(id);
      return;
    }
    onClick(id);
  };

  const animationClassName = useAnimationOnChange(children());

  return (
    <p
      className={clsx([styles.container, className, hintMode && styles.active, animationClassName])}
      onClick={handleClick}
    >
      {children()}
      {after}
    </p>
  );
};

export default observer(FoodName);

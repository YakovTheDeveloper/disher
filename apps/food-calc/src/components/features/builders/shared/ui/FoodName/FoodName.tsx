import { observer } from 'mobx-react-lite';
import styles from './FoodName.module.scss';
import clsx from 'clsx';
import { useCallback, useMemo, useRef } from 'react';
import { useAnimationOnChange } from '@/components/features/builders/shared/hooks/useAnimationOnChange';
import { Typography } from '@/components/ui/atoms/Typography';
type Props = {
  children: () => string | null;
  onClick: () => void;
  after?: React.ReactNode;
  className?: string;
  content: { name: string } | null;
};

const FoodName = ({ className, children, onClick, after }: Props) => {
  const initTitle = children();
  const normalizedTitle = initTitle || 'не выбрано';

  const animationClassName = useAnimationOnChange(initTitle);

  return (
    <Typography
      ellipsis={true}
      variant="custom"
      after={after}
      className={clsx([
        styles.container,
        className,
        animationClassName,
        !initTitle && styles.noTitle,
      ])}
      onClick={onClick}
    >
      {normalizedTitle}
    </Typography>
  );
};

export default observer(FoodName);

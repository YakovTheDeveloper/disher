import { observer } from 'mobx-react-lite';
import styles from './FoodName.module.scss';
import clsx from 'clsx';
import { useCallback, useMemo, useRef } from 'react';
import { useAnimationOnChange } from '@/components/features/builders/shared/hooks/useAnimationOnChange';
import { Typography } from '@/components/ui/atoms/Typography';
import {
  FoodContentDishInstance,
  FoodContentProductInstance,
} from '@/domain/shared/foodContent/foodContent';
type Props = {
  onClick?: () => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLElement>) => void;
  after?: React.ReactNode;
  className?: string;
  content: { name: string } | null;
};

const FoodName = ({ className, onClick, onTouchEnd, after, content }: Props) => {
  const initTitle = content?.name;
  const normalizedTitle = initTitle || 'не выбрано';

  const animationClassName = useAnimationOnChange(initTitle);

  return (
    <Typography
      ellipsis={true}
      variant="custom"
      after={after}
      className={clsx([className, animationClassName, !initTitle && styles.noTitle])}
      onClick={onClick}
      onTouchEnd={onTouchEnd}
    >
      {normalizedTitle}
    </Typography>
  );
};

export default observer(FoodName);

import styles from './FoodName.module.scss';
import clsx from 'clsx';
import { useAnimationOnChange } from '@/hooks/useAnimationOnChange';
import { Typography } from '@/shared/ui/atoms/Typography';

type Props = {
  onClick?: () => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLElement>) => void;
  after?: React.ReactNode;
  className?: string;
  content: { name: string } | null;
  htmlFor?: string;
};

const FoodName = ({ className, onClick, onTouchEnd, after, content, htmlFor }: Props) => {
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
      onTouchEnd={onTouchEnd ? () => onTouchEnd({} as React.TouchEvent<HTMLElement>) : undefined}
      as={htmlFor ? 'label' : 'p'}
      htmlFor={htmlFor}
    >
      {normalizedTitle}
    </Typography>
  );
};

export default FoodName;

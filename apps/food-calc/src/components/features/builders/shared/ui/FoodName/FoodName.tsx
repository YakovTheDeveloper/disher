import styles from './FoodName.module.scss';
import clsx from 'clsx';
import { useAnimationOnChange } from '@/components/features/builders/shared/hooks/useAnimationOnChange';
import { Typography } from '@/components/ui/atoms/Typography';

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
      <label htmlFor="search">{normalizedTitle}</label>
    </Typography>
  );
};

export default FoodName;

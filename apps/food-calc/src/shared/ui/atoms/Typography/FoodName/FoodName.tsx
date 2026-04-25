import styles from './FoodName.module.scss';
import clsx from 'clsx';
import { Typography } from '@/shared/ui/atoms/Typography';
import { ChangeHighlight } from '@/shared/ui/ChangeHighlight';

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

  return (
    <Typography
      ellipsis={true}
      variant="custom"
      after={after}
      className={clsx([className, styles.capitalize, !initTitle && styles.noTitle])}
      onClick={onClick}
      onTouchEnd={onTouchEnd ? () => onTouchEnd({} as React.TouchEvent<HTMLElement>) : undefined}
      as={htmlFor ? 'label' : 'p'}
      htmlFor={htmlFor}
    >
      <ChangeHighlight trigger={initTitle} variant="sweep">
        {normalizedTitle}
      </ChangeHighlight>
    </Typography>
  );
};

export default FoodName;

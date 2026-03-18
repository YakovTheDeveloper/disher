import { observer } from 'mobx-react-lite';
import styles from './Time.module.scss';
import clsx from 'clsx';
import { useAnimationOnChange } from '@/components/features/builders/shared/hooks/useAnimationOnChange';

type Props = {
  children: () => string | null;
  onClick: () => void;
};

const Time = ({ children, onClick }: Props) => {
  const className = useAnimationOnChange(children());

  return (
    <p onClick={onClick} className={clsx([className, styles.container])}>
      {children()}
    </p>
  );
};

export default observer(Time);

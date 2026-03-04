import styles from './AddButton.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import PlusIcon from '@/assets/icons/rounded-plus-icon.svg';

type Props = {
  onClick: VoidFunction;
  children?: string;
  animate?: () => boolean;
};
const AddButton = ({ onClick }: Props) => {
  // const shouldAnimate = animate?.();

  return (
    <button onClick={onClick} className={clsx([styles.container])}>
      <span className={styles.icon}>
        <PlusIcon />
      </span>
    </button>
  );
};

export default observer(AddButton);

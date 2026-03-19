import styles from './AddButton.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import PlusIcon from '@/assets/icons/rounded-plus-icon.svg';

type Props = {
  onClick: VoidFunction;
  children?: string;
  animate?: () => boolean;
  as?: 'button' | 'label';
  htmlFor?: string;
};
const AddButton = ({ onClick, as = 'button', htmlFor }: Props) => {
  const Tag = as;
  return (
    <Tag onClick={onClick} htmlFor={htmlFor} className={clsx([styles.container])}>
      <span className={styles.icon}>
        <PlusIcon />
      </span>
    </Tag>
  );
};

export default observer(AddButton);

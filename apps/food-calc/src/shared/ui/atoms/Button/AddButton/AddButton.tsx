import styles from './AddButton.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import PlusIcon from '@/shared/assets/icons/rounded-plus-icon.svg';

type Props = {
  onClick: VoidFunction;
  children?: string;
  animate?: () => boolean;
  as?: 'button' | 'label';
  htmlFor?: string;
  prominent?: boolean;
};
const AddButton = ({ onClick, children, as = 'button', htmlFor, prominent }: Props) => {
  const Tag = as;
  return (
    <Tag
      onClick={onClick}
      htmlFor={htmlFor}
      className={clsx(
        styles.container,
        children && styles.withText,
        prominent && styles.prominent,
      )}
    >
      <span className={styles.icon}>
        <PlusIcon />
      </span>
      {children && <span className={styles.text}>{children}</span>}
    </Tag>
  );
};

export default observer(AddButton);

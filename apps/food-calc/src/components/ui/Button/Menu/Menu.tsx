import { observer } from 'mobx-react-lite';
import styles from './Menu.module.scss';
import clsx from 'clsx';
type Props = {
  children?: React.ReactNode;
  menu: {
    isOpen: boolean;
  };
  onClick: VoidFunction;
};

const Menu = ({ onClick, menu }: Props) => {
  return (
    <button
      onClick={onClick}
      className={clsx([styles.container, menu.isOpen && styles.active])}
    ></button>
  );
};

export default observer(Menu);

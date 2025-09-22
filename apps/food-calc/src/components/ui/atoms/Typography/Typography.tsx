import { observer } from 'mobx-react-lite';
import styles from './Typography.module.scss';
import clsx from 'clsx';
type Props = {
  children: React.ReactNode;
  variant: 'action';
};

const Typography = ({ children, variant }: Props) => {
  return <p className={clsx([styles.container, styles[variant]])}>{children}</p>;
};

export default observer(Typography);

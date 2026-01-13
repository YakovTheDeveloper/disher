import { observer } from 'mobx-react-lite';
import styles from './Spacer.module.scss';
type Props = {
  variant: 'drawer-footer-offset';
};

const Spacer = ({ variant }: Props) => {
  return <div className={styles[variant]} />;
};

export default observer(Spacer);

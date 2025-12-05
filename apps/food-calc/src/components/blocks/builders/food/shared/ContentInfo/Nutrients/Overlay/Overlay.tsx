import { observer } from 'mobx-react-lite';
import styles from './Overlay.module.scss';
import { RequestState } from '@/api/RequestState';
import { isEmpty } from '@/lib/empty';
import { toJS } from 'mobx';
import clsx from 'clsx';
type Props = {
  loading: () => boolean;
  children: string;
};

const Overlay = ({ children, loading }: Props) => {
  const isLoading = loading();

  return (
    <div className={clsx(styles.loader, isLoading && styles.animate)}>{!isLoading && children}</div>
  );
};

export default observer(Overlay);

import { observer } from 'mobx-react-lite';
import styles from './FilterButton.module.scss';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useInteractions,
  useClick,
} from '@floating-ui/react';

type Props = {
  children?: React.ReactNode;
};

const FilterButton = ({ children }: Props) => {
  return (
    <div className={styles.wrapper}>
      <button className={styles.button}>Фильтр</button>
    </div>
  );
};

export default observer(FilterButton);

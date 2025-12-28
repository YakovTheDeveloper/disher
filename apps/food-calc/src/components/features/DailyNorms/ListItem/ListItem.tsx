import { observer } from 'mobx-react-lite';
import styles from './ListItem.module.scss';
import { DailyNormEntityUI } from '@/components/features/DailyNorms/viewModel/DailyNormsViewModel';
import clsx from 'clsx';
import { uiStore } from '@/store/rootStore';
import { DailyNormsStoreUI } from '@/store/uiStore/dailyNorms/DailyNormsStoreUI';
type Props = {
  children?: React.ReactNode;
  item: DailyNormEntityUI;
  dailyNormsStoreUI?: DailyNormsStoreUI;
  onTitle?: (id: number | string) => void;
};

const ListItem = ({ children, item, dailyNormsStoreUI = uiStore.dailyNorms, onTitle }: Props) => {
  const onChoose = (normId: number | string) => {
    dailyNormsStoreUI.setCurrentNorm(normId);
  };

  const currentAppliedNorm = dailyNormsStoreUI.currentNorm;

  const isApplied = (id: number | string) => currentAppliedNorm.id === id;

  const onTitleClick = () => {
    onTitle?.(item.id);
  };

  return (
    <li key={item.id} onClick={() => onChoose(item.id)} className={styles.listItem}>
      <button
        className={clsx([styles.listItemSelectButton, isApplied(item.id) && styles.active])}
      ></button>
      <div onClick={onTitleClick} className={styles.listItemContent}>
        {children}
      </div>
      {/* <p>{item.description}</p> */}
    </li>
  );
};

export default observer(ListItem);

import { observer } from 'mobx-react-lite';
import styles from './Tabs.module.scss';

type Props = {
  tabs: Array<{ value: string; label: string }>;
  current: string;
  setTab: (tab: string) => void;
};

const Tabs = ({ tabs, current, setTab }: Props) => {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`${styles.tabButton} ${current === tab.value ? styles.activeTab : ''}`}
          onClick={() => setTab(tab.value)}
          aria-selected={current === tab.value}
          role="tab"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default observer(Tabs);

import { observer } from 'mobx-react-lite';
import styles from './Tabs.module.scss';
import clsx from 'clsx';

type Props = {
  tabs: Array<{ value: string; label: string; alternativeLabel?: string }>;
  current: string;
  setTab: (tab: string) => void;
  variant: keyof typeof GridVariants;
};

const Tabs = ({ tabs, current, setTab, variant }: Props) => {
  return (
    <div className={styles.tabs} style={{ gridTemplateColumns: GridVariants[variant] }}>
      {tabs.map((tab) => {
        const isActive = current === tab.value;
        const hasAlternative = !!tab.alternativeLabel;

        return (
          <button
            key={tab.value}
            className={`${styles.tabButton} ${isActive ? styles.activeTab : ''}`}
            onClick={() => setTab(tab.value)}
            aria-selected={isActive}
            role="tab"
          >
            <span className={clsx([styles.label])}>
              {tab.label}
              {tab.alternativeLabel && (
                <span
                  className={clsx(
                    styles.alternative,
                    !isActive && hasAlternative && styles.alternative__inactive,
                    'ellipsis'
                  )}
                >
                  {tab.alternativeLabel}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const GridVariants = {
  scheduleFoodAdd: '100px 3fr auto',
  scheduleFoodEdit: '100px auto 3fr auto',
  dishFoodAdd: '1fr auto',
  dishFoodEdit: 'auto 1fr auto',
  scheduleEventAdd: '100px 1fr auto',
  scheduleEventEdit: '100px 1fr auto',
};

export default observer(Tabs);

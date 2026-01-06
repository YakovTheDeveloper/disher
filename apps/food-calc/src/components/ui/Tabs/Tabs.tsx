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
    <div className={styles.tabs}>
      <div
        className={styles.tabsRow}
        style={{
          gridTemplateColumns: GridVariants[variant].slice(0, tabs.length).join(' '),
        }}
      >
        {tabs.map((tab) => {
          const isActive = current === tab.value;
          const hasAlternative = tab.alternativeLabel != null;

          return (
            <div className={`${styles.tabWrapper}`} key={tab.value}>
              {hasAlternative && (
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
              <button
                className={`${styles.tabButton} ${isActive ? styles.activeTab : ''} ellipsis`}
                onClick={() => setTab(tab.value)}
                aria-selected={isActive}
                role="tab"
              >
                {LabelNamesView[tab.value] || tab.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const GridVariants = {
  scheduleFoodAdd: ['auto', '50%', 'auto'],
  scheduleFoodEdit: ['100px', 'auto', '3fr', 'auto'],
  dishFoodAdd: ['1fr', 'auto'],
  dishFoodEdit: ['auto', '1fr', 'auto'],
  scheduleEventAdd: ['100px', '1fr', 'auto'],
  scheduleEventEdit: ['100px', '1fr', 'auto'],
};

const LabelNamesView: Record<string, string> = {
  quantity: 'Сколько',
  value: 'Сколько',
};
// const GridVariants = {
//   scheduleFoodAdd: 'auto 1fr auto',
//   scheduleFoodEdit: 'auto auto 1fr auto',
//   dishFoodAdd: '1fr auto',
//   dishFoodEdit: 'auto 1fr auto',
//   scheduleEventAdd: 'auto 1fr auto',
//   scheduleEventEdit: 'auto 1fr auto',
// };

export default observer(Tabs);

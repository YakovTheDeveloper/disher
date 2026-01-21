import { observer } from 'mobx-react-lite';
import styles from './Tabs.module.scss';
import clsx from 'clsx';
import InfoIcon from '@/assets/icons/cirlceInfo.svg';
type Tab = { value: string; label: string; alternativeLabel?: string; disabled?: boolean };

type Props = {
  tabs: Tab[];
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
            <button
              className={`${styles.tabWrapper} ${isActive && styles.active}`}
              onClick={() => !tab.disabled && setTab(tab.value)}
              key={tab.value}
              aria-selected={isActive}
              role="tab"
              disabled={tab.disabled}
            >
              {hasAlternative && (
                <span
                  className={clsx(
                    styles.header,
                    !isActive && hasAlternative && styles.header__inactive,
                    'ellipsis'
                  )}
                >
                  {tab.alternativeLabel}
                </span>
              )}
              {/* <span className={`${styles.tabButton} ${isActive ? styles.activeTab : ''} ellipsis`}>
                {getTabTitleView(tab)}
              </span> */}
            </button>
          );
        })}
      </div>
    </div>
  );
};
const GridVariants = {
  scheduleFoodAdd: ['auto', '50%', 'auto'],
  scheduleFoodEdit: ['auto', 'auto', '40%', 'auto'],
  dishFoodAdd: ['1fr', 'auto'],
  dishFoodEdit: ['auto', '1fr', 'auto'],
  scheduleEventAdd: ['1fr', '2fr', '1fr'],
  scheduleEventEdit: ['1fr', '2fr', '1fr'],
};

const LabelNamesView: Record<string, string> = {
  quantity: 'Сколько',
  value: 'Сколько',
};

const ValueToIconView: Record<string, React.ReactNode | null> = {
  info: <InfoIcon />,
  value: null,
};

const getTabTitleView = (tab: Tab) => {
  const { label, value } = tab;
  if (value === 'info') return ValueToIconView[value];

  const icon = ValueToIconView[value] || '';
  const normalizedLabel = LabelNamesView[value] || label;

  return [icon, normalizedLabel];
};

export default observer(Tabs);

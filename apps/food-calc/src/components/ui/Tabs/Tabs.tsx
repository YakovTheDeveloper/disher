import { observer } from 'mobx-react-lite';
import styles from './Tabs.module.scss';
import clsx from 'clsx';
import InfoIcon from '@/assets/icons/cirlceInfo.svg';

export type Tab = {
  value: string;
  label: string;
  alternativeLabel?: string;
  disabled?: boolean;
  finishLabel?: string;
};

export type TabsProps = {
  tabs: Tab[];
  current: string;
  setTab: (tab: string) => void;
  variant: keyof typeof GridVariants;
  onFinish?: () => void;
  finishHintText?: string;
};

const TABS_DEFAULT_FINISH_HINT = 'Click to finish!';

const Tabs = ({ tabs, current, setTab, variant, onFinish, finishHintText }: TabsProps) => {
  const isFinishTab = (index: number) => onFinish && index === tabs.length - 1;

  const handleTabClick = (tab: Tab, index: number) => {
    if (tab.disabled) return;

    if (isFinishTab(index) && current === tab.value && onFinish) {
      onFinish();
    } else {
      setTab(tab.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, tab: Tab, index: number) => {
    if (tab.disabled) return;

    if (
      isFinishTab(index) &&
      current === tab.value &&
      onFinish &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      onFinish();
    }
  };
  return (
    <div className={styles.tabs}>
      <div
        className={styles.tabsRow}
        style={{
          gridTemplateColumns: GridVariants[variant].slice(0, tabs.length).join(' '),
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = current === tab.value;
          const hasAlternative = tab.alternativeLabel != null;
          const isLastFinish = isFinishTab(index);

          return (
            <div
              key={tab.value}
              className={clsx([styles.tabContainer, isLastFinish && isActive && styles.blinking])}
            >
              {isLastFinish && isActive && (
                <span
                  className={clsx(styles.finishHint, styles.finishHint__active)}
                  aria-hidden="true"
                >
                  {tab.finishLabel || finishHintText || TABS_DEFAULT_FINISH_HINT}
                </span>
              )}
              <button
                className={clsx(
                  styles.tabWrapper,
                  isActive && styles.active,
                  isLastFinish && isActive && styles.lastTabActive
                )}
                onClick={() => handleTabClick(tab, index)}
                onKeyDown={(e) => handleKeyDown(e, tab, index)}
                key={tab.value}
                aria-selected={isActive}
                aria-describedby={isLastFinish ? 'finish-hint' : undefined}
                role="tab"
                disabled={tab.disabled}
                tabIndex={isLastFinish && isActive ? 0 : -1}
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
              </button>
            </div>
          );
        })}
      </div>
      {/* {onFinish && (
        <span id="finish-hint" className="sr-only">
          Нажмите Enter или пробел для завершения
        </span>
      )} */}
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
  foodCreate: ['1fr', '1fr'],
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

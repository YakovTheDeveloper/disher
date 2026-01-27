import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useMemo, useEffect, useState } from 'react';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { domainStore } from '@/store/store';
import ModalLayout from '@/components/features/builders/food/shared/components/ModalLayout/ModalLayout';
import { WizardStep } from '@/components/features/builders/food/shared/components/ModalLayout/WizardStep';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import {
  useDraftScheduleItem,
  useSchedule,
  useSelectedScheduleItem,
} from '@/components/features/builders/food/ScheduleBuilder/context';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/types';
import { TimeNow } from '@/components/features/builders/food/shared/ContentEdit/Time/TimeNow';
import WeatherBackground from '@/components/features/WeatherBackground/WeatherBacground';
import styles from './ScheduleFoodAdd.module.scss';
type Props = {
  close: () => void;
  foodStore?: FoodStoreInstance;
  dishStore?: DishStoreInstance;
  variant: 'add' | 'edit';
  defaultTab?: string;
};

const ScheduleFoodAdd = observer(
  ({
    close,
    foodStore = domainStore.foodStore,
    dishStore = domainStore.dishStore,
    variant,
    defaultTab,
  }: Props) => {
    const schedule = useSchedule();
    const hook = variant === 'add' ? useDraftScheduleItem : useSelectedScheduleItem;
    const currentChild = hook();
    console.log('currentChild', currentChild);

    const timeState = useLocalObservable(() => ({
      localTime: currentChild.time,
      handleTimeUpdate(newTime: string) {
        this.localTime = newTime;
        currentChild.updateTime(newTime);
      },
    }));

    useEffect(() => {
      runInAction(() => (timeState.localTime = currentChild.time));
    }, [currentChild.time, timeState]);

    const onFinish = () => {
      if (variant === 'add') {
        schedule.addDraftToFoods();
        close();
      }
    };

    const tabs = [
      { value: 'time', label: 'время', alternativeLabel: currentChild.time },
      { value: 'foodSelect', label: 'еда', alternativeLabel: currentChild.content?.name || '' },
      { value: 'quantity', label: 'количество', alternativeLabel: `${currentChild.quantity}` },
    ];

    const { currentTab, goNext, setTab: originalSetTab } = useTabs(tabs, defaultTab);
    const [direction, setDirection] = useState(1);

    const tabToIndex = {
      time: 0,
      foodSelect: 1,
      quantity: 2,
    } as const;

    const indexToTab = ['time', 'foodSelect', 'quantity'] as const;

    const setTab = (value: (typeof tabs)[number]['value']) => {
      const newIndex = tabToIndex[value];
      const currentIndex = tabToIndex[currentTab as keyof typeof tabToIndex];
      setDirection(newIndex > currentIndex ? 1 : -1);
      originalSetTab(value);
    };

    const handleBack = () => {
      const currentIndex = tabToIndex[currentTab as keyof typeof tabToIndex];
      if (currentIndex > 0) {
        setTab(indexToTab[currentIndex - 1]);
      } else {
        close();
      }
    };

    const onProductChoose = () => {
      setTab('quantity');
    };
    const filterKeys = ['name'] as const;

    const config = useMemo(
      () =>
        [
          {
            tabName: 'продукты',
            list: foodStore.merged,
            filterKeys,
          },
          {
            tabName: 'блюда',
            list: dishStore.merged,
            filterKeys,
          },
        ] as const,
      [foodStore.merged, dishStore.merged]
    );

    const filterState = useFilteringState(config);

    const supFooter = (() => {
      switch (currentTab) {
        case 'time':
          return (
            <div className={styles.bottomPanel}>
              <button className={styles.helpFocusButton}>
                <p className={styles.backgroundText}>Выбрать</p>

                <svg
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g transform="rotate(-10 12 12)">
                    <circle cx="12" cy="12" r="9" fill="#fff" stroke="#000" strokeWidth="1.5" />
                    <circle cx="12" cy="4" r="0.5" fill="#000" />
                    <circle cx="18.5" cy="12" r="0.5" fill="#000" />
                    <circle cx="12" cy="20" r="0.5" fill="#000" />
                    <circle cx="5.5" cy="12" r="0.5" fill="#000" />
                    <line
                      x1="12"
                      y1="12"
                      x2="12"
                      y2="7"
                      stroke="#000"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="12"
                      x2="15"
                      y2="12"
                      stroke="#000"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="12"
                      x2="12"
                      y2="5"
                      stroke="#f00"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="8"
                      y1="3"
                      x2="5"
                      y2="0"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="16"
                      y1="3"
                      x2="19"
                      y2="0"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
              </button>
            </div>
          );
        case 'foodSelect':
          return (
            <div className={styles.bottomPanel}>
              <button className={styles.helpFocusButton}>Выбор</button>
            </div>
          );
        case 'quantity':
          return (
            <div className={styles.bottomPanel}>
              <button className={styles.helpFocusButton}>Выбор</button>

              <FinishButton onClick={onFinish} variant="text">
                добавить еду
              </FinishButton>
              <Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodAdd" />
            </div>
          );
        default:
          return (
            <Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodAdd" />
          );
      }
    })();

    const subHeaderContent = (() => {
      switch (currentTab) {
        case 'foodSelect':
          return <SearchFoodControls searchState={filterState} isVisible={true} />;
        default:
          return undefined;
      }
    })();

    return (
      <ModalLayout
        onBack={tabToIndex[currentTab as keyof typeof tabToIndex] > 0 ? handleBack : close}
        showHeader={currentTab !== 'foodSelect'}
        subHeader={subHeaderContent}
        topRight={<FinishButton onClick={onFinish} />}
        supFooter={supFooter}
        footer={<Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodAdd" />}
        background={<WeatherBackground time={currentChild.time} weatherType="cloudy" />}
      >
        <WizardStep stepKey={currentTab} direction={direction}>
          {currentTab === 'time' && (
            <ContentEdit.Time item={currentChild} timeState={timeState} onFinish={() => goNext()} />
          )}
          {currentTab === 'foodSelect' && (
            <SearchFood
              scheduleChild={currentChild}
              onFinish={onProductChoose}
              searchState={filterState}
            />
          )}
          {currentTab === 'quantity' && (
            <ContentEdit.Quantity item={currentChild} onFinish={onFinish} />
          )}
        </WizardStep>
      </ModalLayout>
    );
  }
);

SearchFoodControls.motionKey = 'food';
TimeNow.motionKey = 'time';

export default ScheduleFoodAdd;

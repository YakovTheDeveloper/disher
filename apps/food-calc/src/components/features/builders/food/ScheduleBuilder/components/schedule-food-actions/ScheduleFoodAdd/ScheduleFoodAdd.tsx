import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useMemo, useRef, useEffect } from 'react';
import { parse, getHours } from 'date-fns';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { domainStore } from '@/store/store';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import {
  useDraftScheduleItem,
  useSchedule,
  useSelectedScheduleItem,
} from '@/components/features/builders/food/ScheduleBuilder/context';
import { SwipeableRef } from '@/components/features/builders/food/shared/ui/layout/Swipeable';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/types';
import SwipeableV2 from '@/components/features/builders/food/shared/ui/layout/Swipeable/SwipeableV2';
import { TimeNow } from '@/components/features/builders/food/shared/ContentEdit/Time/TimeNow';
import { Button } from '@/components/ui/Button';

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

    const swipeRef = useRef<SwipeableRef>(null);

    const tabToIndex = {
      time: 0,
      foodSelect: 1,
      quantity: 2,
    } as const;

    const indexToTab = ['time', 'foodSelect', 'quantity'] as const;

    const setTab = (value: (typeof tabs)[number]['value']) => {
      originalSetTab(value);
      swipeRef.current?.goToPage(tabToIndex[value]);
    };

    const onProductChoose = () => {
      swipeRef.current?.goToPage(tabToIndex.quantity);
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

    const currentImage = useMemo(() => {
      const time = currentChild.time;
      if (!time) return '/morning.png';
      const parsedTime = parse(time, 'HH:mm', new Date());
      const hour = getHours(parsedTime);
      if (hour >= 22 || hour < 6) return '/night.png';
      if (hour >= 18) return '/evening.jfif';
      if (hour >= 12) return '/day.png';
      if (hour >= 6) return '/morning.png';
      return '/morning.png';
    }, [currentChild.time]);

    return (
      <DrawerLayout
        label={<ScreenLabel variant="drawer">Добавить</ScreenLabel>}
        bottom={
          currentTab === 'foodSelect' ? (
            <SearchFoodControls searchState={filterState} isVisible={true} />
          ) : currentTab === 'time' ? (
            <TimeNow timeState={timeState} />
          ) : (
            <FinishButton onClick={onFinish} variant="text">
              добавить еду
            </FinishButton>
          )
        }
        // footer2={<button>Завершить добавление</button>}
        tabs={
          <>
            <Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodAdd" />
          </>
        }
        topRight={<FinishButton onClick={onFinish} />}
      >
        <SwipeableV2
          ref={swipeRef}
          onIndexChange={(index) => originalSetTab(indexToTab[index])}
          image={currentImage}
        >
          <ContentEdit.Time item={currentChild} timeState={timeState} onFinish={goNext} />
          <SearchFood
            scheduleChild={currentChild}
            onFinish={onProductChoose}
            searchState={filterState}
          />
          <ContentEdit.Quantity item={currentChild} onFinish={goNext} />
        </SwipeableV2>

        {/* <Spacer variant="drawer-footer-offset" /> */}
      </DrawerLayout>
    );
  }
);

SearchFoodControls.motionKey = 'food';
TimeNow.motionKey = 'time';

export default ScheduleFoodAdd;

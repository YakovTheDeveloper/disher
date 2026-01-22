import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useMemo, useRef, useEffect } from 'react';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { useSearchParams } from 'react-router-dom';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { domainStore } from '@/store/store';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { useSchedule } from '@/components/features/builders/food/ScheduleBuilder/context';
import { ScheduleFactory } from '@/domain/schedule/factory';
import { SwipeableRef } from '@/components/features/builders/food/shared/ui/layout/Swipeable';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/types';
import SwipeableV2 from '@/components/features/builders/food/shared/ui/layout/Swipeable/SwipeableV2';
import clsx from 'clsx';
import { TimeNow } from '@/components/features/builders/food/shared/ContentEdit/Time/TimeNow';

type Props = {
  close: () => void;
  foodStore?: FoodStoreInstance;
  dishStore?: DishStoreInstance;
};

const ScheduleFoodAdd = observer(
  ({ close, foodStore = domainStore.foodStore, dishStore = domainStore.dishStore }: Props) => {
    const schedule = useSchedule();
    const [searchParams] = useSearchParams();

    const currentChild = useMemo(() => {
      const argsParam = searchParams.get('args');
      if (argsParam) {
        try {
          const args = JSON.parse(argsParam);
          const time = args[0] !== undefined ? args[0] : schedule.lastTimeItemAdded;
          return ScheduleFactory.createScheduleItemDraft(time, {
            content: args[1],
            quantity: args[2],
          });
        } catch {
          return ScheduleFactory.createScheduleItemDraft(schedule.lastTimeItemAdded);
        }
      }
      return ScheduleFactory.createScheduleItemDraft(schedule.lastTimeItemAdded);
    }, [schedule.lastTimeItemAdded, searchParams]);

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
      schedule.addDraftToFoods(currentChild);
      close();
    };

    const tabs = [
      { value: 'time', label: 'время', alternativeLabel: currentChild.time },
      { value: 'foodSelect', label: 'еда', alternativeLabel: currentChild.content?.name || '' },
      { value: 'quantity', label: 'количество', alternativeLabel: `${currentChild.quantity}` },
    ];

    const { currentTab, goNext, setTab: originalSetTab } = useTabs(tabs);

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

    return (
      <DrawerLayout
        label={<ScreenLabel variant="drawer">Добавить</ScreenLabel>}
        bottom={
          currentTab === 'foodSelect' ? (
            <SearchFoodControls searchState={filterState} isVisible={true} />
          ) : currentTab === 'time' ? (
            <TimeNow timeState={timeState} />
          ) : null
        }
        tabs={
          <>
            <Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodAdd" />
          </>
        }
        topRight={<FinishButton onClick={onFinish} />}
      >
        <SwipeableV2 ref={swipeRef} onIndexChange={(index) => originalSetTab(indexToTab[index])}>
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

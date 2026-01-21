import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodAdd.module.scss';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { ScheduleItem } from '@/domain/schedule/schedule';
import { useMemo, useState, useEffect, useRef } from 'react';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { domainStore, mstEnv } from '@/store/store';
import { DrawerLayout as DrawerLayoutOld } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { useSchedule } from '@/components/features/builders/food/ScheduleBuilder/context';
import { createScheduleItemDraft } from '@/domain/schedule/factory';
import {
  Swipeable,
  SwipeableRef,
} from '@/components/features/builders/food/shared/ui/layout/Swipeable';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/types';
import {
  createSearchFoodConfig,
  foodSearchConfing,
} from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/config/config';
import SwipeableV2 from '@/components/features/builders/food/shared/ui/layout/Swipeable/SwipeableV2';
import { TestModalPage } from '@/pages/swipe-test';
import DrawerLayout from '@/pages/swipe-test/DrawerLayout';

type Props = {
  close: () => void;
  foodStore?: FoodStoreInstance;
  dishStore?: DishStoreInstance;
};

const ScheduleFoodAdd = observer(
  ({ close, foodStore = domainStore.foodStore, dishStore = domainStore.dishStore }: Props) => {
    const schedule = useSchedule();

    const currentChild = useMemo(
      () => createScheduleItemDraft(schedule.lastTimeItemAdded),
      [schedule.lastTimeItemAdded]
    );

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
      log(value);
      originalSetTab(value);
      swipeRef.current?.goToPage(tabToIndex[value]);
    };

    const filterKeys = ['name'] as const;

    const config = useMemo(
      () =>
        [
          {
            tabName: 'продукты',
            list: domainStore.foodStore.merged,
            filterKeys,
          },
          {
            tabName: 'блюда',
            list: domainStore.dishStore.merged,
            filterKeys,
          },
        ] as const,
      [domainStore.foodStore.merged, domainStore.dishStore.merged]
    );

    const filterState = useFilteringState(config);

    // return (
    //   <DrawerLayout>
    //     <SwipeableV2>
    //       {/* <ContentEdit.Time item={currentChild} onFinish={goNext} /> */}
    //       <ul style={{ background: 'red' }}>
    //         <p>123123</p>
    //         <p>-</p>
    //         <p>123123</p>
    //         <p>-</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>-</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>-</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>-</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //       </ul>
    //       <ul>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //         <p>123123</p>
    //       </ul>
    //       {/* <SearchFood scheduleChild={currentChild} onFinish={goNext} searchState={filterState} /> */}
    //       <ContentEdit.Quantity item={currentChild} onFinish={goNext} />
    //     </SwipeableV2>
    //   </DrawerLayout>
    // );

    return (
      <DrawerLayoutOld
        label={
          <ScreenLabel className={styles.title} variant="drawer">
            Добавить
          </ScreenLabel>
        }
        tabs={
          <>
            <Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodAdd" />
          </>
        }
        // subHeader={
        //   currentTab === 'foodSelect' && (
        //     <SearchFoodControls searchState={filterState} isVisible={true} />
        //   )
        // }
        topRight={<FinishButton onClick={onFinish} />}
      >
        <SwipeableV2 ref={swipeRef} onIndexChange={(index) => originalSetTab(indexToTab[index])}>
          <ContentEdit.Time item={currentChild} onFinish={goNext} />
          <SearchFood scheduleChild={currentChild} onFinish={goNext} searchState={filterState}>
            <SearchFoodControls searchState={filterState} isVisible={true} />
          </SearchFood>
          <ContentEdit.Quantity item={currentChild} onFinish={goNext} />
        </SwipeableV2>

        {/* <Swipeable
          ref={swipeRef}
          defaultIndex={0}
          onIndexChange={(index) => originalSetTab(indexToTab[index])}
        >
          <ContentEdit.Time item={currentChild} onFinish={goNext} />
          <SearchFood scheduleChild={currentChild} onFinish={goNext} searchState={filterState} />
          <ContentEdit.Quantity item={currentChild} onFinish={goNext} />
        </Swipeable> */}

        <Spacer variant="drawer-footer-offset" />
      </DrawerLayoutOld>
    );
  }
);

export default ScheduleFoodAdd;

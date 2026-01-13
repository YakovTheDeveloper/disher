import { useCallback, useEffect, useMemo } from 'react';
import { TimeGroupUI } from './model/ScheduleBuilderViewModel';
import style from './ScheduleBuilder.module.scss';

import { Swipeable } from '@/components/features/builders/food/shared/ui/layout/Swipeable';
import { List } from '@/components/features/builders/food/ScheduleBuilder/ui/List';
import { ModalRoot } from '@/components/features/builders/food/shared/ModalRoot';
import { TotalNutrients } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients';
import { BuilderUIStore } from '@/components/features/builders/food/shared/BuilderUIStore';
import { observer } from 'mobx-react-lite';
import { DishBuilderContainer } from '@/components/features/builders/food/ScheduleBuilder/ui/DishBuilderContainer';
import { ScheduleUIEventEmitter } from '@/components/features/builders/food/shared/emitter';
import { EventsBuilder } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder';
import { DailyEventData } from '@types';
import { DishNutrients } from '@/components/features/builders/food/ScheduleBuilder/components/DishNutrients';

import { FoodNutrients } from '@/components/features/builders/food/shared/components/FoodNutrients';
import { ISODate } from '@/types/common/common';
import { toJS } from 'mobx';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { domainStore } from '@/store/store';
import toaster from '@/infrastructure/toaster/toaster';
import { Navigation } from '@/components/features/builders/food/ScheduleBuilder/ui/Navigation';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { ScreenScroll } from '@/components/features/builders/food/shared/ui/layout/Screen/ScreenScroll';
import { ScheduleFoodEdit } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/ScheduleFoodEdit';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { ScheduleFoodAdd } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/ScheduleFoodAdd';
import { ScheduleEventsAdd } from '@/components/features/builders/food/ScheduleBuilder/components/edit-schedule-events/ScheduleEventsAdd';
import { MotionValue } from 'framer-motion';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { ScheduleSelection } from '@/components/features/schedule/ScheduleSelection';
import { DateChoose } from '@/components/features/builders/food/ScheduleBuilder/components/DateChoose';

export const Modals = {
  Time: 'time',
  Food: 'Food',
  DateChoose: 'DateChoose',
  FoodAdd: 'FoodAdd',
  EventAdd: 'EventAdd',
  EventEdit: 'EventEdit',
  FoodEdit: 'FoodEdit',
  UpdateFood: 'updateFood',
  Quantity: 'quantity',
  DishNutrients: 'dishNutrients',
  CreateDish: 'createDish',
  CopySchedule: 'copySchedule',
  EventTime: 'eventTime',
  EventContent: 'eventContent',
  FoodNutrients: 'foodNutrients',
} as const;

export type ModalsType = (typeof Modals)[keyof typeof Modals];

type Props = {
  onFinish: (payload: Instance<typeof DaySchedule>) => Promise<void>;
  schedule: Instance<typeof DaySchedule>;
  date: ISODate;
};

const ScheduleBuilder = ({ schedule, onFinish, date }: Props) => {
  const navigate = useNavigate();

  const modals = useDailyScheduleModals();
  const options = useMemo(() => new BuilderUIStore([0, 1, 2]), []);

  const onFoodAdd = () => {
    modals.set(Modals.FoodAdd, {}, ['item_id']);
  };

  const onEventAdd = () => {
    modals.set(Modals.EventAdd, {}, ['item_id']);
  };

  const onUniteFoodIntoDish = useCallback((group: TimeGroupUI<Instance<typeof ScheduleItem>>) => {
    const dish = domainStore.interactionsService.createNewDishAndAppendToSchedule(
      schedule,
      group.items,
      group.time
    );
    toaster.success('Блюдо создано');
    navigate(RouterLinks.DishBuilder + '/' + dish.id);

    // modals.set('createDish');
  }, []);

  // const onFoodUpdate = (payload: DishEntity | FoodEntity | string) => {
  //   console.log('onFoodUpdate payload', payload);
  //   schedule.children.updateCurrent(schedule.getChildContentVariant(payload));
  //   modals.close();
  // };

  // const getFoodModel = useCallback(() => foodStore, []);
  // const getCurrentFoodWithQuantity = useCallback(() => schedule.foodWithQuantity, []);

  console.log('SChedule buILder REnder');

  const onFinishHandler = useCallback(() => {
    console.log('onFinishHandle payloadr', toJS(schedule));
    onFinish(schedule);
  }, [schedule]);

  // const onCopyFinish = useCallback(
  //   (items: DayScheduleItemUI[]) => {
  //     schedule.addChildren(items);
  //     modals.close();
  //   },
  //   [schedule, modals]
  // );

  // const onEventContentUpdateModalOpen = (id: string | number) => {
  //   schedule.dailyEvents.children.setCurrentId(id);
  //   modals.set('eventContent');
  // };

  const onEventContentCreateModalOpen = () => {
    // schedule.dailyEvents.children.setCurrentId(-1);
    modals.set('eventContent');
  };

  // const onEventTimeModalOpen = (id: string | number) => {
  //   schedule.dailyEvents.children.setCurrentId(id);
  //   modals.set('eventTime');
  // };

  const onEventContentSelect = (content: DailyEventData) => {
    if (schedule.dailyEvents.children.currentId === -1) {
      schedule.dailyEvents.add(content);
      return;
    }
    schedule.dailyEvents.children.updateCurrent({ data: content });
  };

  // const onDailyEventsUpdate = async () => {
  //   updateDailyEvents;
  // };

  useEffect(() => {
    if (options.currentPage === 2) {
      document.body.style.backgroundColor = '#e6e6e6';
    } else {
      document.body.style.backgroundColor = '';
    }
  }, [options.currentPage]);

  useEffect(() => {
    ScheduleUIEventEmitter.on('OPEN_COPY_SCHEDULE_MODAL', () => {
      modals.set('copySchedule');
    });
    ScheduleUIEventEmitter.on('CREATE_DISH', () => {
      const newDish = domainStore.dishStore.addLocal({ isDraft: true });
      navigate(RouterLinks.DishBuilder + '/' + newDish.id);
    });
  }, []);

  // const isLoading = useCallback(() => {
  //   return scheduleStore.requestState.createOrUpdate.get(date)?.loading || false;
  // }, [date]);

  // const isLoading = () => scheduleStore.requestState.createOrUpdate.get(date)?.loading || false;

  const pageNames = useMemo(() => ['нутриенты', 'еда', 'события'], []);

  const foodOptions = useMemo(() => options.getShowMoreOptions(1), [options]);

  const onPageChange = (page: number, total: number) => {
    options.setCurrentPage(page, total);
    domainStore.globalUiStore.clearSelection();
  };

  return (
    <>
      <Swipeable index={options.currentPage} defaultIndex={1} onIndexChange={onPageChange}>
        {[
          <Screen key={1} title={<ScreenLabel variant="screenHeader">Нутриенты</ScreenLabel>}>
            <TotalNutrients store={schedule} />
          </Screen>,

          <Screen
            actions={<ActionsHeader />}
            key={2}
            title={
              <ScreenLabel
                variant="screenHeader"
                onClick={() => {
                  navigate(RouterLinks.Dishes);
                }}
              >
                Еда
              </ScreenLabel>
            }
            header={(scrollYProgress: MotionValue<number>) => (
              <Navigation scrollYProgress={scrollYProgress}></Navigation>
            )}
            bottom={<Button.Add onClick={onFoodAdd} />}
          >
            <List onDishesUnite={onUniteFoodIntoDish} options={foodOptions} schedule={schedule} />
          </Screen>,

          <Screen
            key={3}
            title={<ScreenLabel variant="screenHeader">События</ScreenLabel>}
            header={(scrollYProgress: MotionValue<number>) => (
              <Navigation scrollYProgress={scrollYProgress}></Navigation>
            )}
            bottom={<Button.Add onClick={onEventAdd} />}
          >
            <EventsBuilder schedule={schedule} options={foodOptions} />
          </Screen>,
        ]}
      </Swipeable>

      <ModalRoot modals={modals}>
        {{
          [Modals.DateChoose]: <DateChoose />,
          [Modals.FoodAdd]: <ScheduleFoodAdd schedule={schedule} />,
          [Modals.FoodEdit]: <ScheduleFoodEdit schedule={schedule} defaultTab="foodChange" />,
          [Modals.Time]: <ScheduleFoodEdit schedule={schedule} defaultTab="time" />,
          [Modals.Quantity]: <ScheduleFoodEdit schedule={schedule} defaultTab="quantity" />,
          // [Modals.Time]: <ContentEdit.Time store={schedule} onFinish={modals.close} />,
          // [Modals.Quantity]: <ContentEdit.Quantity store={schedule} onFinish={modals.close} />,
          [Modals.DishNutrients]: <DishNutrients store={schedule} />,
          [Modals.FoodNutrients]: <FoodNutrients store={schedule} />,
          [Modals.CreateDish]: <DishBuilderContainer store={schedule} />,
          // [Modals.CopySchedule]: <CopySchedule onFinish={onCopyFinish} />,
          [Modals.EventAdd]: <ScheduleEventsAdd schedule={schedule} onFinish={onFinishHandler} />,
          [Modals.EventEdit]: <ScheduleEventsAdd schedule={schedule} onFinish={onFinishHandler} />,
          // [Modals.EventTime]: (
          //   <ContentEdit.Time vm={schedule.dailyEventItemsStore} onFinish={modals.close} />
          // ),
        }}
      </ModalRoot>
    </>
  );
};

export default observer(ScheduleBuilder);

import { useCallback, useEffect, useMemo } from 'react';
import { TimeGroupUI } from './model/ScheduleBuilderViewModel';
import style from './ScheduleBuilder.module.scss';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';

import { Swipeable } from '@/components/features/builders/food/shared/ui/layout/Swipeable';
import { List } from '@/components/features/builders/food/ScheduleBuilder/ui/List';
import { ModalRoot } from '@/components/features/builders/food/shared/ModalRoot';
import { TotalNutrients } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients';
import { BuilderUIStore } from '@/components/features/builders/food/shared/BuilderUIStore';
import { observer } from 'mobx-react-lite';
import { DishBuilderContainer } from '@/components/features/builders/food/ScheduleBuilder/ui/DishBuilderContainer';
import { ScheduleUIEventEmitter } from '@/components/features/builders/food/shared/emitter';
import { EventsBuilder } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder';
import { EventContent } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent';
import { DailyEventData } from '@types';
import { DishNutrients } from '@/components/features/builders/food/ScheduleBuilder/components/DishNutrients';

import { FoodNutrients } from '@/components/features/builders/food/shared/components/FoodNutrients';
import { ISODate } from '@/types/common/common';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
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
import { ScheduleFoodEdit } from '@/components/features/builders/food/ScheduleBuilder/components/ScheduleFoodEdit';
import { Actions } from '@/components/features/builders/food/shared/ui/Actions';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { ScheduleFoodAdd } from '@/components/features/builders/food/ScheduleBuilder/components/ScheduleFoodAdd';

export const Modals = {
  Time: 'time',
  Food: 'Food',
  FoodAdd: 'FoodAdd',
  EventAdd: 'EventAdd',
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

  return (
    <div className={style.container}>
      <Swipeable
        index={options.currentPage}
        defaultIndex={1}
        onIndexChange={options.setCurrentPage}
      >
        {[
          <Screen key={1}>
            <Navigation>
              <ScreenLabel>{'Нутриенты'}</ScreenLabel>
            </Navigation>
            <ScreenScroll>
              <TotalNutrients store={schedule} />
            </ScreenScroll>
          </Screen>,

          <Screen key={2}>
            <Navigation>
              <ScreenLabel>{'Еда'}</ScreenLabel>
            </Navigation>
            <ScreenScroll>
              <List onDishesUnite={onUniteFoodIntoDish} options={foodOptions} schedule={schedule} />
            </ScreenScroll>
            <Actions isShow={() => true} isPortal={false}>
              <Button.Finish onClick={onFinishHandler} content={schedule} isShow={() => true}>
                синхронизовать
              </Button.Finish>
              <Button.Add onClick={onFoodAdd} />
            </Actions>
          </Screen>,

          <Screen key={3}>
            <Navigation>
              <ScreenLabel>{'События'}</ScreenLabel>
            </Navigation>
            <ScreenScroll>
              <EventsBuilder schedule={schedule} options={foodOptions} />
            </ScreenScroll>
            <Actions isShow={() => true} isPortal={false}>
              <Button.Finish onClick={onFinishHandler} content={schedule} isShow={() => true}>
                синхронизовать
              </Button.Finish>
              <Button.Add onClick={onEventAdd} />
            </Actions>
          </Screen>,
        ]}
      </Swipeable>

      <ModalRoot modals={modals}>
        {{
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
          [Modals.EventAdd]: (
            <EventContent
              onSelect={onEventContentSelect}
              onFinish={modals.close}
              schedule={schedule}
            />
          ),
          // [Modals.EventTime]: (
          //   <ContentEdit.Time vm={schedule.dailyEventItemsStore} onFinish={modals.close} />
          // ),
        }}
      </ModalRoot>
    </div>
  );
};

export default observer(ScheduleBuilder);

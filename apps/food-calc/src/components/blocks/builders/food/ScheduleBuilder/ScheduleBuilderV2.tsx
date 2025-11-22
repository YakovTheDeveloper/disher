import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AddChild,
  DayScheduleItemUI,
  DayScheduleUI,
  ScheduleBuilderViewModel,
  TimeGroupUI,
} from './model/ScheduleBuilderViewModel';
import style from './ScheduleBuilder.module.scss';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { ContentEdit } from '@/components/blocks/builders/food/shared/ContentEdit';
import { Button as ActionButton } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';

import { dishStore, foodStore, scheduleStore } from '@/store/rootStore';
import {
  ScheduleContentSearchItem,
  SearchViewModel,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/SearchViewModel';
import { SearchFilterTabs } from '@/components/blocks/builders/food/ScheduleBuilder/ui/SearchFilterTabs';
import { Swipeable } from '@/components/blocks/builders/food/shared/ui/layout/Swipeable';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { List } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List';
import { ModalRoot } from '@/components/blocks/builders/food/shared/ModalRoot';
import { TotalNutrients } from '@/components/blocks/builders/food/shared/ContentInfo/TotalNutrients';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
import { observer } from 'mobx-react-lite';
import DishCreatingStore from '@/components/blocks/builders/food/ScheduleBuilder/model/CreateDishViewModel';
import { DishBuilderContainer } from '@/components/blocks/builders/food/ScheduleBuilder/ui/DishBuilderContainer';
import { useItemActionsUI } from '@/components/blocks/builders/food/shared/useItemActionsUI';
import {
  NutrientsEventEmitter,
  ScheduleUIEventEmitter,
} from '@/components/blocks/builders/food/shared/emitter';
import { CopySchedule } from '@/components/blocks/builders/food/ScheduleBuilder/ui/CopySchedule';
import { EventsBuilder } from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder';
import { EventContent } from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent';
import { DailyEventData } from '@types';
import { DishNutrients } from '@/components/blocks/builders/food/ScheduleBuilder/components/DishNutrients';

import { FoodNutrients } from '@/components/blocks/builders/food/shared/components/FoodNutrients';
import { WithOverlay } from '@/components/ui/Overlay';
import { ISODate } from '@/types/common/common';
import { FoodAdd } from '@/components/blocks/builders/food/ScheduleBuilder/components/FoodAdd';
import { DishEntity } from '@/store/models/dish/types';
import { FoodEntity } from '@/store/models/food/types';
import { toJS } from 'mobx';
import { RootActions } from '@/components/blocks/builders/food/ScheduleBuilder/components/RootActions';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule';
import { useDailyScheduleModals } from '@/components/blocks/builders/food/ScheduleBuilder/modalContext';

export const Modals = {
  Time: 'time',
  Food: 'Food',
  AddFood: 'addFood',
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
  onFinish: (payload: DayScheduleUI) => Promise<void>;
  schedule: Instance<typeof DaySchedule>;
  date: ISODate;
};

const ScheduleBuilder = ({ schedule, onFinish, date }: Props) => {
  // const modals = useMemo(() => new ModalStoreUI<ModalsType>(), []);

  const modals = useDailyScheduleModals();

  const options = useMemo(() => new BuilderUIStore([0, 1, 2]), []);

  // const _itemActions = useItemActionsUI({ variant: 'schedule', modals, vm: schedule });
  // const itemActions = useMemo(() => _itemActions, [modals, schedule]);

  const totalNutrients = useRef<{
    calculate: () => void;
  }>(null);

  const onFoodsOpenCreate = () => {
    schedule.setCurrent(-1);
    modals.set('Food');
  };

  const dishCreatingStore = useMemo(() => new DishCreatingStore(dishStore, schedule), []);

  const onUniteFoodIntoDish = useCallback(
    (group: TimeGroupUI) => {
      dishCreatingStore.create(group);
      modals.set('createDish');
    },
    [dishCreatingStore]
  );

  // const onFoodUpdate = (payload: DishEntity | FoodEntity | string) => {
  //   console.log('onFoodUpdate payload', payload);
  //   schedule.children.updateCurrent(schedule.getChildContentVariant(payload));
  //   modals.close();
  // };

  // const getFoodModel = useCallback(() => foodStore, []);
  // const getCurrentFoodWithQuantity = useCallback(() => schedule.foodWithQuantity, []);

  console.log('SChedule buILder REnder');

  const onFinishHandler = useCallback(() => {
    const payload = schedule.payload();
    console.log('onFinishHandle payloadr', toJS(payload));
    onFinish(payload);
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

  // const onEventContentSelect = (content: DailyEventData) => {
  //   if (schedule.dailyEvents.children.currentId === -1) {
  //     schedule.dailyEvents.add(content);
  //     return;
  //   }
  //   schedule.dailyEvents.children.updateCurrent({ data: content });
  // };

  // const onDailyEventsUpdate = async () => {
  //   updateDailyEvents;
  // };

  useEffect(() => {
    if (!totalNutrients.current) return;
    if (options.currentPage === 0) totalNutrients.current?.calculate();
  }, [options.currentPage, totalNutrients.current]);

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
  }, []);

  // const isLoading = useCallback(() => {
  //   return scheduleStore.requestState.createOrUpdate.get(date)?.loading || false;
  // }, [date]);

  const isLoading = () => scheduleStore.requestState.createOrUpdate.get(date)?.loading || false;

  const pageNames = useMemo(() => ['нутриенты', 'еда', 'события'], []);

  const foodOptions = useMemo(() => options.getShowMoreOptions(1), [options]);

  return (
    <div className={style.container}>
      <Swipeable model={options} pageNames={pageNames}>
        {/* <TotalNutrients vm={schedule} ref={totalNutrients} /> */}

        {[
          <></>,
          <WithOverlay isLoading={isLoading}>
            <List onDishesUnite={onUniteFoodIntoDish} options={foodOptions} schedule={schedule} />
          </WithOverlay>,
          <></>,
        ]}

        {/* <WithOverlay isLoading={isLoading}>
          <EventsBuilder
            vm={schedule}
            onEventContentUpdateModalOpen={onEventContentUpdateModalOpen}
            onEventTimeModalOpen={onEventTimeModalOpen}
            onEventContentCreateModalOpen={onEventContentCreateModalOpen}
            options={options}
          />
        </WithOverlay> */}
      </Swipeable>

      <ModalRoot modals={modals}>
        {{
          [Modals.Food]: <FoodAdd store={schedule} />,
          [Modals.Time]: <ContentEdit.Time store={schedule} onFinish={modals.close} />,
          [Modals.Quantity]: <ContentEdit.Quantity store={schedule} onFinish={modals.close} />,
          // [Modals.DishNutrients]: <DishNutrients vm={schedule} />,
          // [Modals.FoodNutrients]: <FoodNutrients vm={schedule} />,
          // [Modals.CreateDish]: <DishBuilderContainer store={dishCreatingStore} />,
          // [Modals.CopySchedule]: <CopySchedule onFinish={onCopyFinish} />,
          // [Modals.EventContent]: (
          //   <EventContent
          //     onSelect={onEventContentSelect}
          //     onFinish={modals.close}
          //     schedule={schedule}
          //   />
          // ),
          // [Modals.EventTime]: (
          //   <ContentEdit.Time vm={schedule.dailyEventItemsStore} onFinish={modals.close} />
          // ),
        }}
      </ModalRoot>

      <RootActions
        isLoading={isLoading}
        modals={modals}
        onFinishHandler={onFinishHandler}
        onEventContentCreateModalOpen={onEventContentCreateModalOpen}
        onFoodsOpenCreate={onFoodsOpenCreate}
        options={options}
        schedule={schedule}
      />
    </div>
  );
};

export default observer(ScheduleBuilder);

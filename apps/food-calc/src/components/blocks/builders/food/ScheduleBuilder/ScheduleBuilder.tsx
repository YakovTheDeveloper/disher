import { useCallback, useEffect, useMemo } from 'react';
import {
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

import { dishStore, foodStore } from '@/store/rootStore';
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

export const Modals = {
  Time: 'time',
  Food: 'food',
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
  schedule: ScheduleBuilderViewModel;
  getLoadingState: () => boolean;
};

const ScheduleBuilder = ({ schedule, onFinish, getLoadingState }: Props) => {
  const modals = useMemo(() => new ModalStoreUI<ModalsType>(), []);

  const options = useMemo(() => new BuilderUIStore(), []);
  const searchFiltering = useMemo(() => new SearchViewModel(foodStore, dishStore), []);

  const _itemActions = useItemActionsUI({ variant: 'schedule', modals, vm: schedule });
  const itemActions = useMemo(() => _itemActions, [modals, schedule]);

  const onFoodsOpenCreate = () => {
    schedule.children.setCurrentId(-1);
    modals.set('food');
  };

  const dishCreatingStore = useMemo(() => new DishCreatingStore(dishStore, schedule), []);

  const onUniteFoodIntoDish = useCallback(
    (group: TimeGroupUI) => {
      dishCreatingStore.create(group);
      modals.set('createDish');
    },
    [dishCreatingStore]
  );

  const onFoodSelect = (item: ScheduleContentSearchItem) => {
    const childToAdd =
      item.type === 'dish'
        ? {
            dish: {
              id: item.id,
              items: item.items,
              name: item.name,
            },
            food: null,
          }
        : {
            food: {
              id: item.id,
              name: item.name,
            },
            dish: null,
          };

    searchFiltering.setFilterText('');
    if (!schedule.children.current) {
      schedule.addChild(childToAdd);
      modals.close();
      return;
    }
    schedule.children.updateCurrent(childToAdd);
    modals.close();
  };

  const getFoodModel = useCallback(() => foodStore, []);
  const getCurrentFoodWithQuantity = useCallback(() => schedule.foodWithQuantity, []);

  console.log('SChedule buILder REnder');

  const shouldActionShow = useCallback(() => !modals.current && options.currentPage !== 0, []);

  // useEffect(() => {
  //   const noItems = schedule.schedule.items.length === 0;
  //   if (noItems) {
  //     options.pushFoodSelectMessage('Начнем заполнять наш день');
  //     onFoodsOpenCreate();
  //   }
  //   return () => {
  //     options.clearFoodSelectMessage();
  //   };
  // }, [schedule]);

  const onFinishHandler = useCallback(() => {
    onFinish(schedule.payload());
  }, [schedule]);

  const onCopyFinish = useCallback(
    (items: DayScheduleItemUI[]) => {
      schedule.addChildren(items);
      modals.close();
    },
    [schedule, modals]
  );

  const onEventContentUpdateModalOpen = (id: string | number) => {
    schedule.dailyEvents.children.setCurrentId(id);
    modals.set('eventContent');
  };

  const onEventContentCreateModalOpen = () => {
    schedule.dailyEvents.children.setCurrentId(-1);
    modals.set('eventContent');
  };

  const onEventTimeModalOpen = (id: string | number) => {
    schedule.dailyEvents.children.setCurrentId(id);
    modals.set('eventTime');
  };

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
    if (options.currentPage === 0) NutrientsEventEmitter.emit('RECALCULATE_NUTRIENTS');
  }, [options.currentPage]);

  useEffect(() => {
    ScheduleUIEventEmitter.on('OPEN_COPY_SCHEDULE_MODAL', () => {
      modals.set('copySchedule');
    });
  }, []);

  return (
    <div className={style.container}>
      <Swipeable model={options}>
        <TotalNutrients vm={schedule} />

        <List
          itemActions={itemActions}
          content={schedule}
          onDishesUnite={onUniteFoodIntoDish}
          options={options}
          getLoadingState={getLoadingState}
        />

        <EventsBuilder
          vm={schedule}
          onEventContentUpdateModalOpen={onEventContentUpdateModalOpen}
          onEventTimeModalOpen={onEventTimeModalOpen}
          onEventContentCreateModalOpen={onEventContentCreateModalOpen}
          options={options}
        />
      </Swipeable>

      <ModalRoot modals={modals}>
        {{
          [Modals.Food]: (
            <ContentEdit.Food
              options={options}
              content={searchFiltering}
              before={<SearchFilterTabs model={searchFiltering} />}
            >
              <ContentEdit.SearchList
                content={searchFiltering}
                onFoodSelect={onFoodSelect}
                vm={schedule}
              />
            </ContentEdit.Food>
          ),
          [Modals.Time]: <ContentEdit.Time vm={schedule.children} onFinish={modals.close} />,
          [Modals.Quantity]: (
            <ContentEdit.Quantity vm={schedule.children} onFinish={modals.close} />
          ),
          [Modals.DishNutrients]: <DishNutrients vm={schedule} />,
          [Modals.FoodNutrients]: <FoodNutrients vm={schedule} />,
          [Modals.CreateDish]: <DishBuilderContainer store={dishCreatingStore} />,
          [Modals.CopySchedule]: <CopySchedule onFinish={onCopyFinish} />,
          [Modals.EventContent]: (
            <EventContent
              onSelect={onEventContentSelect}
              onFinish={modals.close}
              schedule={schedule}
            />
          ),
          [Modals.EventTime]: (
            <ContentEdit.Time vm={schedule.dailyEventItemsStore} onFinish={modals.close} />
          ),
        }}
      </ModalRoot>

      <Actions isShow={shouldActionShow}>
        <ActionButton.Finish onClick={onFinishHandler} content={schedule}>
          обновить
        </ActionButton.Finish>
        {options.currentPage === 1 && <ActionButton.Add onClick={onFoodsOpenCreate} />}
        {options.currentPage === 2 && <ActionButton.Add onClick={onEventContentCreateModalOpen} />}
        <ActionButton.AdditionalOptions options={options} />
      </Actions>
    </div>
  );
};

export default observer(ScheduleBuilder);

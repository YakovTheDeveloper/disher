import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DayScheduleItemUI,
  DayScheduleUI,
  ScheduleBuilderViewModel,
  TimeGroupUI,
} from './model/ScheduleBuilderViewModel';
import style from './ScheduleBuilder.module.scss';
import { CommonModals, ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { ContentEdit } from '@/components/blocks/builders/food/shared/ContentEdit';
import { createFoodQuantityCollectionDTO } from '@/components/blocks/builders/food/shared/dto';
import { Button as ActionButton } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';

import Modal from '@/components/ui/Modal/Modal';
import { DishBuilder } from '@/components/blocks/builders/food/DishBuilder';
import {
  createDishLocal,
  DishUI,
} from '@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel';
import { addDish } from '@/api/dish/dish.api';
import { dishStore, foodStore } from '@/store/rootStore';
import { SearchViewModel } from '@/components/blocks/builders/food/ScheduleBuilder/model/SearchViewModel';
import { SearchFilterTabs } from '@/components/blocks/builders/food/ScheduleBuilder/ui/SearchFilterTabs';
import { Swipeable } from '@/components/blocks/builders/food/shared/ui/layout/Swipeable';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { List } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List';
import { ModalRoot } from '@/components/blocks/builders/food/shared/ModalRoot';
import { TotalNutrients } from '@/components/blocks/builders/food/shared/ContentInfo/TotalNutrients';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
import { motion } from 'framer-motion';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction, toJS, trace } from 'mobx';
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

export const Modals = {
  Time: 'time',
  Food: 'food',
  Quantity: 'quantity',
  Nutrients: 'nutrients',
  CreateDish: 'createDish',
  CopySchedule: 'copySchedule',
  EventTime: 'eventTime',
  EventContent: 'eventContent',
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

  const dailyEventsItems = schedule.dailyEvents.children;

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

  const onFoodSelect = (data: { id: number; name: string } | null, variant: 'dish' | 'food') => {
    if (!data) return;
    const selection = variant === 'dish' ? { dish: data, food: null } : { food: data, dish: null };
    searchFiltering.setFilterText('');
    if (!schedule.children.current) {
      schedule.addChild(selection);
      modals.close();
      return;
    }
    schedule.children.updateCurrent(selection);
    modals.close();
  };

  const getFoodModel = useCallback(() => foodStore, []);
  const getCurrentFoodWithQuantity = useCallback(() => schedule.foodWithQuantity, []);

  console.log('SChedule buILder REnder');

  const shouldActionShow = useCallback(() => !modals.current && options.currentPage === 1, []);

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
    dailyEventsItems.setCurrentId(id);
    modals.set('eventContent');
  };

  const onEventContentCreateModalOpen = () => {
    dailyEventsItems.setCurrentId(-1);
    modals.set('eventContent');
  };

  const onEventTimeModalOpen = (id: string | number) => {
    dailyEventsItems.setCurrentId(id);
    modals.set('eventTime');
  };

  const onEventContentSelect = (content: DailyEventData) => {
    if (dailyEventsItems.currentId === -1) {
      schedule.dailyEvents.add(content);
      return;
    }
    dailyEventsItems.updateCurrent({ data: content });
  };

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
          vm={schedule.dailyEvents}
          onEventContentUpdateModalOpen={onEventContentUpdateModalOpen}
          onEventTimeModalOpen={onEventTimeModalOpen}
          onEventContentCreateModalOpen={onEventContentCreateModalOpen}
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
          [Modals.Nutrients]: (
            <Nutrients getFood={getFoodModel} getCurrentFood={getCurrentFoodWithQuantity} />
          ),
          [Modals.CreateDish]: <DishBuilderContainer store={dishCreatingStore} />,
          [Modals.CopySchedule]: <CopySchedule onFinish={onCopyFinish} />,
          [Modals.EventContent]: (
            <EventContent
              onSelect={onEventContentSelect}
              onFinish={modals.close}
              current={dailyEventsItems.current?.data}
            />
          ),
          [Modals.EventTime]: <ContentEdit.Time vm={dailyEventsItems} onFinish={modals.close} />,
        }}
      </ModalRoot>

      <Actions isShow={shouldActionShow}>
        <ActionButton.Finish onClick={onFinishHandler} content={schedule}>
          обновить
        </ActionButton.Finish>
        <ActionButton.Add onClick={onFoodsOpenCreate} />
        <ActionButton.AdditionalOptions options={options} />
      </Actions>
    </div>
  );
};

export default observer(ScheduleBuilder);

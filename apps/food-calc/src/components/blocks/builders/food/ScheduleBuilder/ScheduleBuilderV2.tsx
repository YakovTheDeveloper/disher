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
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { useDailyScheduleModals } from '@/components/blocks/builders/food/ScheduleBuilder/modalContext';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { domainStore } from '@/store/store';
import toaster from '@/infrastructure/toaster/toaster';
import { Navigation } from '@/components/blocks/builders/food/ScheduleBuilder/ui/Navigation';
import { ScreenLabel } from '@/components/blocks/builders/food/shared/atoms/ScreenLabel';

export const Modals = {
  Time: 'time',
  Food: 'Food',
  FoodAdd: 'foodAdd',
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

  const onFoodsOpenCreate = () => {
    modals.set('foodAdd', {}, ['item_id']);
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

  const isLoading = () => scheduleStore.requestState.createOrUpdate.get(date)?.loading || false;

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
          <>
            <Navigation>
              <ScreenLabel>{'Нутриенты'}</ScreenLabel>
            </Navigation>
            <TotalNutrients store={schedule} />
          </>,
          <>
            <Navigation>
              <ScreenLabel>{'Еда'}</ScreenLabel>
            </Navigation>
            <WithOverlay isLoading={isLoading}>
              <List onDishesUnite={onUniteFoodIntoDish} options={foodOptions} schedule={schedule} />
            </WithOverlay>
          </>,
          <>
            <Navigation>
              <ScreenLabel>{'События'}</ScreenLabel>
            </Navigation>
            <EventsBuilder schedule={schedule} options={foodOptions} />
          </>,
        ]}
      </Swipeable>

      <ModalRoot modals={modals}>
        {{
          [Modals.FoodAdd]: <FoodAdd store={schedule} />,
          [Modals.Time]: <ContentEdit.Time store={schedule} onFinish={modals.close} />,
          [Modals.Quantity]: <ContentEdit.Quantity store={schedule} onFinish={modals.close} />,
          [Modals.DishNutrients]: <DishNutrients store={schedule} />,
          [Modals.FoodNutrients]: <FoodNutrients store={schedule} />,
          [Modals.CreateDish]: <DishBuilderContainer store={schedule} />,
          // [Modals.CopySchedule]: <CopySchedule onFinish={onCopyFinish} />,
          [Modals.EventContent]: (
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

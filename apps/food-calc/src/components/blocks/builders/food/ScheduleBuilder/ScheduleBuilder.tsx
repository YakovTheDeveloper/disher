import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { observer } from 'mobx-react-lite';
import { useScheduleItemActionsUI } from '@/components/blocks/builders/food/ScheduleBuilder/context';
import { toJS, trace } from 'mobx';

export enum Modals {
  Time = 'time',
  Food = 'food',
  Quantity = 'quantity',
  Nutrients = 'nutrients',
}

type Props = {
  onFinish: (payload: DayScheduleUI) => Promise<void>;
  schedule: ScheduleBuilderViewModel;
  getLoadingState: () => boolean;
};

const ScheduleBuilder = ({ schedule, onFinish, getLoadingState }: Props) => {
  const modals = useMemo(() => new ModalStoreUI<CommonModals | 'time'>(), []);
  const options = useMemo(() => new BuilderUIStore(), []);
  const searchFiltering = useMemo(() => new SearchViewModel(foodStore, dishStore), []);

  const _itemActions = useScheduleItemActionsUI(schedule, modals);
  const itemActions = useMemo(() => _itemActions, [modals, schedule]);

  const onMoreOptions = () => {
    options.toggle();
  };

  const onFoodsOpenCreate = () => {
    schedule.children.setCurrentId(-1);
    modals.set('food');
  };

  const [dishInit, setDishInit] = useState<{
    content: DishUI;
    time: string;
  } | null>(null);

  const onUniteFoodIntoDish = (group: TimeGroupUI) => {
    const { time, items } = group;
    const dto = createFoodQuantityCollectionDTO(items);
    const dish = createDishLocal(dto);
    setDishInit({ content: dish, time });
  };

  const onCreateDish = async (data) => {
    const result = await addDish(data);
    if (!result) return;
    const { id, name } = result;

    dishStore.set(result.id, result);
    schedule.addChild({ dish: { id, name } });

    if (!dishInit) return;
    const { content, time } = dishInit;
    schedule.removeChildrenByTimeAndId(
      time,
      content.items.map(({ food }) => food.id)
    );
    setDishInit(null);
  };

  console.log('main render');

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

  // trace(true);

  // const itemActions = useMemo(
  //   () => ({ onFoodsOpenUpdate, onFoodsOpenCreate, onFoodsOpenInfo, onTimeOpen, onQuantityOpen }),
  //   [schedule, modals]
  // );

  console.log('SChedule buILder REnder');

  const shouldActionShow = useCallback(() => !modals.current && options.currentPage === 1, []);

  useEffect(() => {
    const noItems = schedule.schedule.items.length === 0;
    if (noItems) {
      options.pushFoodSelectMessage('Начнем заполнять наш день');
      onFoodsOpenCreate();
    }
    return () => {
      options.clearFoodSelectMessage();
    };
  }, [schedule]);

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

        <ContentEdit.Questionnaire vm={schedule.questionnaire} />
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
        }}
      </ModalRoot>

      <Modal onClose={() => setDishInit(null)} isOpen={!!dishInit}>
        {dishInit && (
          <DishBuilder
            finishButtonTitle="Обьединить"
            init={dishInit.content}
            onSave={onCreateDish}
          />
        )}
      </Modal>

      <Actions isShow={shouldActionShow}>
        <ActionButton.Finish onFinish={onFinish} content={schedule} />
        <ActionButton.Add onClick={onFoodsOpenCreate} />
        <ActionButton.AdditionalOptions onClick={onMoreOptions} options={options} />
      </Actions>
    </div>
  );
};

export default observer(ScheduleBuilder);

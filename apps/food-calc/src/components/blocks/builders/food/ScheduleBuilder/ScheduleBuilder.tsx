import { useCallback, useMemo, useState } from 'react';
import { ScheduleBuilderViewModel } from './model/ScheduleBuilderViewModel';
import { Suggestion } from '../shared/ModalStoreUI';
import { observer, useLocalStore } from 'mobx-react-lite';
import style from './ScheduleBuilder.module.scss';
import clsx from 'clsx';
import { ScheduleEntity } from '@/store/scheduleStore/types';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { ContentEdit } from '@/components/blocks/builders/food/shared/ContentEdit';
import { Storage } from '@/infrastructure/storage';
import {
  getAllFoodIds,
  getScheduleProductsByTime,
  getTotalFoodAndDishFoodQuantityFromOne,
} from '@/store/scheduleStore/schedule.domain';
import { useNavigate } from 'react-router';
import { createFoodQuantityCollectionDTO } from '@/components/blocks/builders/food/shared/dto';
import { Button as ActionButton } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { Button } from '@/components/ui/Button';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';

import Modal from '@/components/ui/Modal/Modal';
import { DishBuilder } from '@/components/blocks/builders/food/DishBuilder';
import {
  createDishLocal,
  DishUI,
} from '@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel';
import { toJS } from 'mobx';
import { addDish } from '@/api/dish/dish.api';
import { dishStore, foodStore } from '@/store/rootStore';
import { ListItem } from '@/components/blocks/builders/food/shared/ui/ListItem';
import { SearchViewModel } from '@/components/blocks/builders/food/ScheduleBuilder/model/SearchViewModel';
import { FoodModelStore } from '@/store/models/food/foodModelStore';
import { DishModelStore } from '@/store/models/dish/dishStore';
import { SearchFilterTabs } from '@/components/blocks/builders/food/ScheduleBuilder/ui/SearchFilterTabs';
import { AnimatePresence } from 'framer-motion';
import { Navigation } from '@/components/blocks/builders/food/ScheduleBuilder/ui/Navigation';
import { Swipeable } from '@/components/blocks/builders/food/shared/ui/layout/Swipeable';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { List } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List';
import { ModalRoot } from '@/components/blocks/builders/food/shared/ModalRoot';
import { TotalNutrients } from '@/components/blocks/builders/food/shared/ContentInfo/TotalNutrients';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';

enum Modals {
  Time = 'time',
  Food = 'food',
  Quantity = 'quantity',
  Nutrients = 'Nutrients',
}

type Props = {
  onSave: (payload: ScheduleEntity, id?: number) => Promise<ScheduleEntity | undefined>;
  finishButtonTitle: string;
  children: React.ReactNode;
  schedule: ScheduleBuilderViewModel;
};

const ScheduleBuilder = ({ schedule, onSave, finishButtonTitle, children }: Props) => {
  const modals = useMemo(() => new ModalStoreUI<Modals>(), []);
  const options = useMemo(() => new BuilderUIStore(), []);
  const searchFiltering = useMemo(() => new SearchViewModel(foodStore, dishStore), []);

  const onFoodsOpen = () => {
    schedule.children.setCurrentId(-1);
    modals.set(Modals.Food);
  };

  const onTitle = (id: string | number) => {
    schedule.children.setCurrentId(id);
    modals.set(Modals.Food);
  };

  const onTitleInfoMode = (id: string | number) => {
    schedule.children.setCurrentId(id);
    if (!schedule.children.current) return;
    const food = getTotalFoodAndDishFoodQuantityFromOne(schedule.children.current);
    const ids = getAllFoodIds(food);
    foodStore.loadFoodWithNutrientsByFoodIds(ids);
    modals.set(Modals.Nutrients);
  };

  const onTime = (id: string | number) => {
    schedule.children.setCurrentId(id);
    modals.set(Modals.Time);
  };

  const onQuantity = (id: string | number) => {
    schedule.children.setCurrentId(id);
    modals.set(Modals.Quantity);
  };

  const onFinish = async () => {
    await onSave(...schedule.payload);
  };

  const onMoreOptions = () => {
    options.toggle();
  };

  const [dishInit, setDishInit] = useState<{
    content: DishUI;
    time: string;
  } | null>(null);

  const onDishCreateClick = (time: string) => {
    const scheduleItemsByTime = getScheduleProductsByTime(schedule.schedule, time);
    console.log('asd', toJS(scheduleItemsByTime));
    const dto = createFoodQuantityCollectionDTO(scheduleItemsByTime);
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

  return (
    <div className={style.container}>
      <header className={style.header}>
        {children}
        <Navigation />
      </header>

      <Swipeable model={options}>
        <TotalNutrients vm={schedule} />
        <List
          content={schedule}
          onDishCreate={onDishCreateClick}
          onTime={onTime}
          onTitle={onTitle}
          onTitleInfoMode={onTitleInfoMode}
          options={options}
          onQuantity={onQuantity}
        />
        <ContentEdit.Questionnaire vm={schedule.questionnaire} />
      </Swipeable>

      <Modal isOpen={() => modals.current === Modals.Food} onClose={modals.close}>
        <ContentEdit.Food
          content={searchFiltering}
          before={<SearchFilterTabs model={searchFiltering} />}
        >
          <ContentEdit.SearchList
            content={searchFiltering}
            onFoodSelect={onFoodSelect}
            vm={schedule}
          />
        </ContentEdit.Food>
      </Modal>

      <ModalRoot modals={modals}>
        {{
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

      <Actions isShow={() => !modals.current && options.currentPage !== 0}>
        <ActionButton.Finish onClick={onFinish}>{finishButtonTitle}</ActionButton.Finish>
        <ActionButton.Add onClick={onFoodsOpen} />
        <ActionButton.AdditionalOptions onClick={onMoreOptions}>
          больше
        </ActionButton.AdditionalOptions>
      </Actions>
    </div>
  );
};

export default ScheduleBuilder;

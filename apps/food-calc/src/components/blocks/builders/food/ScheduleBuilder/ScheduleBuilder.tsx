import { useCallback, useMemo, useState } from 'react';
import { ScheduleBuilderViewModel } from './model/ScheduleBuilderViewModel';
import { Suggestion } from '../shared/ModalStoreUI';
import { observer } from 'mobx-react-lite';
import style from './ScheduleBuilder.module.scss';
import clsx from 'clsx';
import { ScheduleEntity } from '@/store/scheduleStore/types';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { ContentEdit } from '@/components/blocks/builders/food/shared/ContentEdit';
import { Storage } from '@/infrastructure/storage';
import { getScheduleProductsByTime } from '@/store/scheduleStore/schedule.domain';
import { useNavigate } from 'react-router';
import { createFoodQuantityCollectionDTO } from '@/components/blocks/builders/food/shared/dto';
import { Button as ActionButton } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { Button } from '@/components/ui/Button';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';
import { OptionsStoreUI } from '@/components/blocks/builders/food/shared/OptionsStoreUI';
import Modal from '@/components/ui/Modal/Modal';
import { DishBuilder } from '@/components/blocks/builders/food/DishBuilder';
import {
  createDishLocal,
  DishUI,
} from '@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel';
import { toJS } from 'mobx';
import { addDish } from '@/api/dish/dish.api';
import { dishStore, foodStore, uiStore } from '@/store/rootStore';
import { ListItem } from '@/components/blocks/builders/food/shared/ui/ListItem';
import { SearchViewModel } from '@/components/blocks/builders/food/ScheduleBuilder/model/SearchViewModel';
import { FoodModelStore } from '@/store/models/food/foodStore';
import { DishModelStore } from '@/store/models/dish/dishStore';
import { SearchFilterTabs } from '@/components/blocks/builders/food/ScheduleBuilder/ui/SearchFilterTabs';
import { AnimatePresence } from 'framer-motion';
import { Navigation } from '@/components/blocks/builders/food/ScheduleBuilder/ui/Navigation';
import { Swipeable } from '@/components/blocks/builders/food/shared/ui/layout/Swipeable';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';

const isSameTimeAsPrevious = (items: { time: string }[], index: number, time: string) => {
  return items[index - 1]?.time === time;
};

const isSameTimeAsNext = (items: { time: string }[], index: number, time: string) => {
  return items[index + 1]?.time === time;
};

const getTimeDifferenceWithPrevious = (
  items: { time: string }[],
  index: number,
  time: string
): string | null => {
  if (index === 0 || !items[index - 1]) return null;

  const previousTime = items[index - 1].time;

  const toMinutes = (t: string) => {
    const [hours, minutes] = t.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const diffMinutes = toMinutes(time) - toMinutes(previousTime);

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  const minutesView = minutes > 0 ? minutes + ' мин. ' : '';
  const hoursView = hours > 0 ? hours + ' ч. ' : '';

  return `${hoursView}${minutesView}`;
};

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
  const options = useMemo(() => new OptionsStoreUI(), []);
  const searchFiltering = useMemo(() => new SearchViewModel(foodStore, dishStore), []);
  const menuUi = uiStore.menu;

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
    const ids = schedule.foodWithQuantity.map(({ id }) => ({
      id,
    }));
    foodStore.getWithNutrientsByFoodIds(ids);
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

  const onDishCreateClick = (e, time: string) => {
    e?.stopPropagation();
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

      <Swipeable>
        <ul className={style.list}>
          {schedule.scheduleItemsSorted.map(
            (
              { id, food = null, quantity, time, customFoodName = '', dish = null },
              index,
              items
            ) => {
              const notSameTimeAsPrevious = !isSameTimeAsPrevious(items, index, time);
              const sameTimeAsNext = isSameTimeAsNext(items, index, time);
              const timeDifference = getTimeDifferenceWithPrevious(items, index, time);
              return (
                <ListItem
                  options={options}
                  key={id}
                  className={clsx([
                    dish && style.listItem_dish,
                    notSameTimeAsPrevious && style.listItem_lined,
                    sameTimeAsNext && style.listItem_noShadow,
                  ])}
                >
                  <p onClick={() => onTime(id)} className={style.listItemTime}>
                    {time || '00:00'}
                  </p>
                  <p>
                    <span
                      className={clsx([style.listItemTopBlock, style.listItemMessage])}
                      hidden={!timeDifference}
                    >
                      {timeDifference}
                    </span>
                    <FoodName
                      hintMode={options.showAdditionals}
                      onClick={() => onTitle(id)}
                      onClickHintModeOn={() => onTitleInfoMode(id)}
                    >
                      {food ? food.name : dish ? dish.name : customFoodName}
                    </FoodName>
                    <span
                      onClick={(e) => onDishCreateClick(e, time)}
                      className={clsx([style.listItemTopBlock, style.listItemTopBlock_right])}
                      hidden={!timeDifference}
                    >
                      обьединить в блюдо
                    </span>
                  </p>
                  <p onClick={() => onQuantity(id)}>{quantity}</p>
                </ListItem>
              );
            }
          )}
        </ul>
        <ContentEdit.Questionnaire vm={schedule.questionnaire} />
      </Swipeable>

      {modals.current === Modals.Food && (
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
      )}
      {modals.current === Modals.Time && (
        <ContentEdit.Time vm={schedule.children} onFinish={modals.close} />
      )}
      {modals.current === Modals.Quantity && (
        <ContentEdit.Quantity vm={schedule.children} onFinish={modals.close} />
      )}

      <Modal isOpen={modals.current === Modals.Nutrients} onClose={modals.close}>
        <Nutrients getFood={getFoodModel} getCurrentFood={getCurrentFoodWithQuantity} />
      </Modal>

      <Modal onClose={() => setDishInit(null)} isOpen={!!dishInit}>
        {dishInit && (
          <DishBuilder
            finishButtonTitle="Обьединить"
            init={dishInit.content}
            onSave={onCreateDish}
          />
        )}
      </Modal>

      <Actions isShow={!modals.current}>
        <ActionButton.Add onClick={onFoodsOpen} />
        <ActionButton.Finish onClick={onFinish}>{finishButtonTitle}</ActionButton.Finish>
        <ActionButton.AdditionalOptions onClick={onMoreOptions}>
          больше
        </ActionButton.AdditionalOptions>
      </Actions>
    </div>
  );
};

export default observer(ScheduleBuilder);

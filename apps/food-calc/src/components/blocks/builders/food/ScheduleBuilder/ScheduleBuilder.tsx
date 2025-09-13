import { useMemo, useState } from 'react';
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

const getTitle = (input: string) => {
  const date = new Date(input);

  const day = date.getUTCDate();
  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long', timeZone: 'UTC' }).format(
    date
  );
  const weekdayName = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', timeZone: 'UTC' }).format(
    date
  );

  return `${day} ${monthName}, ${weekdayName}`;
};

enum Modals {
  Time = 'time',
  Food = 'food',
  Quantity = 'quantity',
  Questionnaire = 'questionnaire',
}

type Props = {
  init: ScheduleEntity;
  onSave: (payload: ScheduleEntity, id?: number) => Promise<ScheduleEntity | undefined>;
  finishButtonTitle: string;
  children: React.ReactNode;
};

const ScheduleBuilder = ({ init, onSave, finishButtonTitle, children }: Props) => {
  const schedules = useMemo(() => new ScheduleBuilderViewModel(init), []);
  const modals = useMemo(() => new ModalStoreUI<Modals>(), []);
  const options = useMemo(() => new OptionsStoreUI(), []);
  const searchFiltering = useMemo(() => new SearchViewModel(foodStore, dishStore), []);
  const menuUi = uiStore.menu;
  const onFoodsOpen = () => {
    schedules.children.setCurrentId(-1);
    modals.set(Modals.Food);
  };

  const onTitle = (id: string | number) => {
    schedules.children.setCurrentId(id);
    modals.set(Modals.Food);
  };

  const onTime = (id: string | number) => {
    schedules.children.setCurrentId(id);
    modals.set(Modals.Time);
  };

  const onQuantity = (id: string | number) => {
    schedules.children.setCurrentId(id);
    modals.set(Modals.Quantity);
  };

  const onFinish = async () => {
    await onSave(...schedules.payload);
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
    const scheduleItemsByTime = getScheduleProductsByTime(schedules.schedule, time);
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
    schedules.addChild({ dish: { id, name } });

    if (!dishInit) return;
    const { content, time } = dishInit;
    schedules.removeChildrenByTimeAndId(
      time,
      content.items.map(({ food }) => food.id)
    );
    setDishInit(null);
  };

  const onFoodSelect = (data: { id: number; name: string } | null, variant: 'dish' | 'food') => {
    if (!data) return;
    const selection = variant === 'dish' ? { dish: data, food: null } : { food: data, dish: null };
    searchFiltering.setFilterText('');
    if (!schedules.children.current) {
      schedules.addChild(selection);
      modals.close();
      return;
    }
    schedules.children.updateCurrent(selection);
    modals.close();
  };

  const onQuestionnaireButtonClick = () => modals.set(Modals.Questionnaire);

  return (
    <div className={style.container}>
      <header className={style.header}>
        {children}
        <h1>{getTitle(schedules.date)}</h1>
        <button onClick={onQuestionnaireButtonClick}>бумажка</button>
      </header>
      <ul className={style.list}>
        {schedules.scheduleItemsSorted.map(
          ({ id, food = null, quantity, time, customFoodName = '', dish = null }, index, items) => {
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
                <p onClick={() => onTitle(id)}>
                  <span
                    className={clsx([style.listItemTopBlock, style.listItemMessage])}
                    hidden={!timeDifference}
                  >
                    {timeDifference}
                  </span>
                  {food ? food.name : dish ? dish.name : customFoodName}
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
      {modals.current === Modals.Food && (
        <ContentEdit.Food
          content={searchFiltering}
          before={<SearchFilterTabs model={searchFiltering} />}
        >
          <ContentEdit.SearchList
            content={searchFiltering}
            onFoodSelect={onFoodSelect}
            vm={schedules}
          />
        </ContentEdit.Food>
      )}
      {modals.current === Modals.Time && (
        <ContentEdit.Time vm={schedules.children} onFinish={modals.close} />
      )}
      {modals.current === Modals.Quantity && (
        <ContentEdit.Quantity vm={schedules.children} onFinish={modals.close} />
      )}

      <Modal onClose={() => setDishInit(null)} isOpen={!!dishInit}>
        {dishInit && (
          <DishBuilder
            finishButtonTitle="Обьединить"
            init={dishInit.content}
            onSave={onCreateDish}
          />
        )}
      </Modal>

      <Modal onClose={modals.close} isOpen={modals.current === Modals.Questionnaire}>
        <ContentEdit.Questionnaire vm={schedules.questionnaire} />
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

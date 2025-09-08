import { observer } from 'mobx-react-lite';
import { DayScheduleItemUI, ScheduleBuilderViewModel } from '../../model/ScheduleBuilderViewModel';
import style from './ScheduleBuilderFoodSuggestions.module.scss';
import commonStyle from '../ScheduleBuilderSuggestions.module.scss';
import { initProducts } from '@/store/productStore/initProducts';
import clsx from 'clsx';
import { useState } from 'react';

type Props = {
  vm: {
    currentScheduleItem: ScheduleBuilderViewModel['currentScheduleItem'];
    onSuggestionSelect: ScheduleBuilderViewModel['onSuggestionSelect'];
  };
};

const FOOD_NAME_PLACEHOLDER = 'Гречка...';

const ScheduleBuilderFoodSuggestions = ({ vm }: Props) => {
  const [searchText, setSearchText] = useState('');

  const variants = initProducts.filter(({ name }) => {
    return name.toLowerCase().includes(searchText.toLowerCase());
  });

  const onFoodNameChange = (e) => setSearchText(e.target.value);

  const onFoodItemSelect = (id: number, name: string) => {
    vm.onSuggestionSelect(id, name);
    setSearchText('');
  };

  if (!vm.currentScheduleItem) return null;

  return (
    <div className={clsx([style.ScheduleBuilderFoodSuggestions, commonStyle.SuggestionWrapper])}>
      <div className={style.ScheduleBuilderFoodSuggestions__inputs}>
        <input
          value={searchText}
          placeholder={FOOD_NAME_PLACEHOLDER}
          onChange={onFoodNameChange}
          className={style.ScheduleBuilderFoodSuggestions__inputsItem}
        />
        {/* <input value={foodQuantity} onChange={onFoodQuantityChange} className={style.ScheduleBuilderFoodSuggestions__inputsItem} /> */}
      </div>
      <ul className={style.ScheduleBuilderFoodSuggestions__list}>
        {variants.map(({ id, name }) => (
          <li
            key={id}
            className={clsx([
              style.ScheduleBuilderFoodSuggestions__listItem,
              id === vm.currentScheduleItem?.foodId &&
                style.ScheduleBuilderFoodSuggestions__listItem_active,
            ])}
            onClick={() => onFoodItemSelect(id, name)}
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default observer(ScheduleBuilderFoodSuggestions);

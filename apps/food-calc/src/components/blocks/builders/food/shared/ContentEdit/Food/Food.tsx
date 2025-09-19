import { observer } from 'mobx-react-lite';
import style from './Food.module.scss';
import commonStyle from '../ContentEdit.module.scss';
import clsx from 'clsx';
import React from 'react';

type Props = {
  content: {
    filterText: string;
    setFilterText: (text: string) => void;
  };
  options: {
    getFoodSelectMessage: () => string | null;
  };
  before?: React.ReactNode;
  children?: React.ReactNode;
};

const FOOD_NAME_PLACEHOLDER = 'Гречка...';

const Food = ({ before, content, children, options }: Props) => {
  const onFoodNameChange = (e) => content.setFilterText(e.target.value);
  const message = options.getFoodSelectMessage();
  return (
    <div className={clsx([style.content, commonStyle.SuggestionWrapper])}>
      {message}
      <div className={style.content__header}>
        {before}
        <input
          value={content.filterText}
          placeholder={FOOD_NAME_PLACEHOLDER}
          onChange={onFoodNameChange}
          className={style.searchInput}
        />
      </div>
      {children}
    </div>
  );
};

export default observer(Food);

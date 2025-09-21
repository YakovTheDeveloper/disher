import { useCallback, useMemo } from 'react';
import { DishBuilderViewModel, DishItemUI } from './model/DishBuilderViewModel';

import { observer } from 'mobx-react-lite';
import style from './DishBuilder.module.scss';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { ContentEdit } from '@/components/blocks/builders/food/shared/ContentEdit';
import { DishEntity } from '@/store/models/dish/types';
import { CommonListItem } from '@/components/blocks/builders/food/shared/ui/CommonListItem';
import { Button } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { Heading } from '@/components/blocks/builders/food/DishBuilder/ui/Heading';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';
import { Quantity } from '@/components/blocks/builders/food/shared/ui/Quantity';
import { useItemActionsUI } from '@/components/blocks/builders/food/shared/useItemActionsUI';
import { DishListItem } from '@/components/blocks/builders/food/DishBuilder/ui/DishListItem';
import { ModalRoot } from '@/components/blocks/builders/food/shared/ModalRoot';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { SearchViewModel } from '@/components/blocks/builders/food/DishBuilder/model/SearchViewModel';
import { foodStore } from '@/store/rootStore';
import { FoodModelStore } from '@/store/models/food/foodModelStore';

export const Modals = {
  Food: 'food',
  Quantity: 'quantity',
  Nutrients: 'nutrients',
} as const;

export type ModalsType = (typeof Modals)[keyof typeof Modals];

type Props = {
  init: DishBuilderViewModel;
  onFinish: (payload: T) => Promise<void>;
  foodModelStore?: FoodModelStore;
  finishButtonTitle: string;
};

const DishBuilder = ({ init, onFinish, foodModelStore = foodStore, finishButtonTitle }: Props) => {
  const dishes = init;
  const modals = useMemo(() => new ModalStoreUI<ModalsType>(), []);
  const options = useMemo(() => new BuilderUIStore(), []);
  const searchFiltering = useMemo(() => new SearchViewModel(foodModelStore), []);

  const _itemActions = useItemActionsUI({ variant: 'dish', modals, vm: dishes });
  const itemActions = useMemo(() => _itemActions, [modals, dishes]);

  const onFoodsOpen = () => {
    dishes.children.setCurrentId(-1);
    modals.set(Modals.Food);
  };

  const onFoodSelect = (food: { id: number; name: string } | null) => {
    if (!food) return;
    if (!dishes.children.current) {
      dishes.addChild(food);
      modals.close();
      return;
    }
    dishes.children.updateCurrent({ food });
  };

  const onMoreOptions = () => {
    options.toggle();
  };

  return (
    <div className={style.container}>
      <Heading vm={dishes} />
      <ul className={style.list}>
        {dishes.content.items.map((content) => {
          return (
            <DishListItem
              key={content.id}
              content={content}
              itemActions={itemActions}
              options={options}
            />
          );
        })}
      </ul>
      <ModalRoot modals={modals}>
        {{
          [Modals.Food]: (
            <ContentEdit.Food options={options} content={searchFiltering}>
              <ContentEdit.SearchList
                content={searchFiltering}
                onFoodSelect={onFoodSelect}
                vm={dishes}
              />
            </ContentEdit.Food>
          ),
          [Modals.Quantity]: <ContentEdit.Quantity vm={dishes.children} onFinish={modals.close} />,
          [Modals.Nutrients]: <Nutrients getCurrentFood={() => {}} />,
        }}
      </ModalRoot>

      <Actions isShow={() => !modals.current}>
        <Button.Finish onFinish={onFinish} content={dishes} />
        <Button.Add onClick={onFoodsOpen} />
        <Button.AdditionalOptions onClick={onMoreOptions} options={options} />
      </Actions>
    </div>
  );
};

export default observer(DishBuilder);

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
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { SearchViewModel } from '@/components/blocks/builders/food/DishBuilder/model/SearchViewModel';
import { foodStore } from '@/store/rootStore';
import { FoodModelStore } from '@/store/models/food/foodModelStore';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish';
import { useDishModals } from '@/components/blocks/builders/food/DishBuilder/modalContext';
import { FoodAdd } from '@/components/blocks/builders/food/DishBuilder/components/FoodAdd';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import ModalRoot from '@/components/blocks/builders/food/shared/ModalRoot/ModalRoot';

export const Modals = {
  Food: 'food',
  Quantity: 'quantity',
  Nutrients: 'nutrients',
} as const;

export type ModalsType = (typeof Modals)[keyof typeof Modals];

type Props = {
  init: Instance<typeof Dish>;
  onFinish: (data: Instance<typeof Dish>) => Promise<void>;
  foodModelStore?: FoodModelStore;
  finishButtonTitle: string;
};

const DishBuilder = ({ init, onFinish, foodModelStore = foodStore, finishButtonTitle }: Props) => {
  const dishes = init;
  const modals = useDishModals();
  const options = useMemo(() => new BuilderUIStore([0, 1]), []);
  const searchFiltering = useMemo(() => new SearchViewModel(foodModelStore), []);

  const onFoodsOpen = () => {
    modals.set(Modals.Food);
  };

  const onMoreOptions = () => {
    options.toggle();
  };

  const onSync = () => {
    onFinish(dishes);
  };

  return (
    <div className={style.container}>
      <Heading store={dishes} />
      <ItemsList>
        {dishes.items.map((content) => {
          return (
            <DishListItem key={content.id} controller={init} content={content} options={options} />
          );
        })}
      </ItemsList>

      <ModalRoot modals={modals}>
        {{
          [Modals.Food]: <FoodAdd store={dishes} />,
          [Modals.Quantity]: <ContentEdit.Quantity store={dishes} onFinish={modals.close} />,
          [Modals.Nutrients]: <Nutrients getCurrentFood={() => {}} />,
        }}
      </ModalRoot>

      <Actions isShow={() => !modals.current}>
        <Button.Finish onClick={onSync} content={dishes} isShow={() => true}>
          синхронизовать
        </Button.Finish>
        <Button.Add onClick={onFoodsOpen} />
        <Button.AdditionalOptions onClick={onMoreOptions} options={options} isShow={() => true} />
      </Actions>
    </div>
  );
};

export default observer(DishBuilder);

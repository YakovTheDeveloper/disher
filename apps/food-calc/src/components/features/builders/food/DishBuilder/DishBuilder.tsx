import { useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import style from './DishBuilder.module.scss';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { Heading } from '@/components/features/builders/food/DishBuilder/ui/Heading';
import { BuilderUIStore } from '@/components/features/builders/food/shared/BuilderUIStore';
import { Actions } from '@/components/features/builders/food/shared/ui/Actions';
import { DishListItem } from '@/components/features/builders/food/DishBuilder/ui/DishListItem';
import { Nutrients } from '@/components/features/builders/food/shared/ContentInfo/Nutrients';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish';
import { useDishModals } from '@/components/features/builders/food/DishBuilder/modalContext';
import { FoodAdd } from '@/components/features/builders/food/DishBuilder/components/FoodAdd';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import ModalRoot from '@/components/features/builders/food/shared/ModalRoot/ModalRoot';

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

const DishBuilder = ({ init, onFinish, finishButtonTitle }: Props) => {
  const dishes = init;
  const modals = useDishModals();
  const options = useMemo(() => new BuilderUIStore([0, 1]), []);

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

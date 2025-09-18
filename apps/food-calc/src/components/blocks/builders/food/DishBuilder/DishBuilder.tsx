import { useMemo } from 'react';
import { DishBuilderViewModel } from './model/DishBuilderViewModel';

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

export enum Modals {
  Food = 'food',
  Quantity = 'quantity',
  Nutrients = 'Nutrients',
}

type Props = {
  init: DishEntity;
  onSave: (payload: DishEntity, id?: number) => Promise<DishEntity | undefined>;
  finishButtonTitle: string;
};

const DishBuilder = ({ init, onSave, finishButtonTitle }: Props) => {
  const dishes = useMemo(() => new DishBuilderViewModel(init), []);
  const modals = useMemo(() => new ModalStoreUI<Modals>(), []);
  const options = useMemo(() => new BuilderUIStore(), []);

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

  const onTitle = (id: string | number) => {
    dishes.children.setCurrentId(id);
    modals.set(Modals.Food);
  };

  const onQuantity = (id: string | number) => {
    dishes.children.setCurrentId(id);
    modals.set(Modals.Quantity);
  };

  const onFinish = async () => {
    await onSave(...dishes.payload);
  };

  const onMoreOptions = () => {
    options.toggle();
  };

  return (
    <div className={style.container}>
      <Heading vm={dishes} />
      <ul className={style.list}>
        {dishes.schedule.items.map(({ id, food, quantity }) => {
          return (
            <CommonListItem key={id} options={options}>
              <FoodName
                className={style.foodName}
                onClick={() => onTitle(id)}
                hintMode={options.showAdditionals}
              >
                {food.name}
              </FoodName>
              <p onClick={() => onQuantity(id)}>{quantity}</p>
            </CommonListItem>
          );
        })}
      </ul>
      {modals.current === Modals.Food && (
        <ContentEdit.Food
          vm={dishes.children}
          onFinish={modals.close}
          onFoodSelect={onFoodSelect}
        />
      )}
      {modals.current === Modals.Quantity && (
        <ContentEdit.Quantity vm={dishes.children} onFinish={modals.close} />
      )}

      <Actions isShow={!modals.current}>
        <Button.Add onClick={onFoodsOpen} />
        <Button.Finish onClick={onFinish}>{finishButtonTitle}</Button.Finish>
        <Button.AdditionalOptions onClick={onMoreOptions}>больше</Button.AdditionalOptions>
      </Actions>
    </div>
  );
};

export default observer(DishBuilder);

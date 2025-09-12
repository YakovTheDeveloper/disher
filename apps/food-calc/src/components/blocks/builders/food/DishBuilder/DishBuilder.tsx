import { useMemo } from 'react';
import { DishBuilderViewModel } from './model/DishBuilderViewModel';
import { Suggestion } from '../shared/ModalStoreUI';
import { observer } from 'mobx-react-lite';
import style from './DishBuilder.module.scss';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { ContentEdit } from '@/components/blocks/builders/food/shared/ContentEdit';
import { DishEntity } from '@/store/models/dish/types';
import { ListItem } from '@/components/blocks/builders/food/shared/ui/ListItem';
import { Button } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { Heading } from '@/components/blocks/builders/food/DishBuilder/ui/Heading';
import { OptionsStoreUI } from '@/components/blocks/builders/food/shared/OptionsStoreUI';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';

type Props = {
  init: DishEntity;
  onSave: (payload: DishEntity, id?: number) => Promise<DishEntity | undefined>;
  finishButtonTitle: string;
};

const DishBuilder = ({ init, onSave, finishButtonTitle }: Props) => {
  const dishes = useMemo(() => new DishBuilderViewModel(init), []);
  const modals = useMemo(() => new ModalStoreUI(), []);
  const options = useMemo(() => new OptionsStoreUI(), []);

  const onFoodsOpen = () => {
    dishes.children.setCurrentId(-1);
    modals.set(Suggestion.Food);
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
    modals.set(Suggestion.Food);
  };

  const onQuantity = (id: string | number) => {
    dishes.children.setCurrentId(id);
    modals.set(Suggestion.Quantity);
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
            <ListItem key={id} options={options}>
              <FoodName
                className={style.foodName}
                onClick={() => onTitle(id)}
                hintMode={options.showAdditionals}
              >
                {food.name}
              </FoodName>
              <p onClick={() => onQuantity(id)}>{quantity}</p>
            </ListItem>
          );
        })}
      </ul>
      {modals.current === Suggestion.Food && (
        <ContentEdit.Food
          vm={dishes.children}
          onFinish={modals.close}
          onFoodSelect={onFoodSelect}
        />
      )}
      {modals.current === Suggestion.Quantity && (
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

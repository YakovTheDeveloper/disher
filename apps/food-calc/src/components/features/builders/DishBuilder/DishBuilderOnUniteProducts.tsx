import { observer } from 'mobx-react-lite';
import style from './DishBuilder.module.scss';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { Heading } from '@/components/features/builders/DishBuilder/ui/Heading';
import { Actions } from '@/components/features/builders/shared/ui/Actions';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish';
import DishListItemOnUniteProducts from '@/components/features/builders/DishBuilder/ui/DishListItemOnUniteProducts/DishListItemOnUniteProducts';

export const Modals = {
  Food: 'food',
  Quantity: 'quantity',
  Nutrients: 'nutrients',
} as const;

export type ModalsType = (typeof Modals)[keyof typeof Modals];

type Props = {
  init: Instance<typeof Dish>;
  onFinish: (payload: T) => Promise<void>;
};

const DishBuilderOnUniteProducts = ({ init, onFinish }: Props) => {
  const dishes = init;

  return (
    <div className={style.container}>
      <Heading store={dishes} />
      <ul className={style.list}>
        {dishes.items.map((content) => {
          return (
            <DishListItemOnUniteProducts
              key={content.id}
              content={content}
              options={{ showAdditionals: true }}
            />
          );
        })}
      </ul>

      <Actions isShow={() => true} zIndex={101}>
        <Buttons.Finish onClick={onFinish} content={dishes} isShow={() => true}>
          добавить блюдо
        </Buttons.Finish>
      </Actions>
    </div>
  );
};

export default observer(DishBuilderOnUniteProducts);

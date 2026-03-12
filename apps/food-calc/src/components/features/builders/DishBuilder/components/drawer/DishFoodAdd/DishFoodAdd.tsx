import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { DishItem } from '@/domain/dish/Dish.model';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFoodButton } from '@/components/features/builders/shared/components/SearchFood';
import Logo from '@/assets/icons/logo.svg';
import { Instance } from 'mobx-state-tree';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';
import Button from '@/components/ui/atoms/Button/Button';
import s from './DishFoodAdd.module.scss';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';

type Props = {
  dishChildItem: Instance<typeof DishItem>;
  dishId: string;
  onCommit: () => void;
};

const DishFoodAdd = observer(({ dishId, dishChildItem, onCommit }: Props) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { toDish } = useAppRoutes();

  const handleFinish = () => {
    onCommit();
    toDish(dishId);
  };

  const onFoodAdd = (payload: { variant: 'dish' | 'product'; id: string }) => {
    if (payload.variant === 'dish') return;
    dishChildItem.updateFood(payload.id);
    setIsSearchExpanded(false);
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <span className={s.headerTitle}>
          <ScreenLabel>Редактировать блюдо</ScreenLabel>
        </span>
      </header>

      <div className={s.spacer} />

      <div className={s.content}>
        <SearchFormExpandable
          isExpanded={isSearchExpanded}
          trigger={
            <SearchFoodButton
              onClick={() => setIsSearchExpanded(true)}
              leftSlot={
                <span
                  style={{
                    fontSize: '1.5em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Logo />
                </span>
              }
              placeholder="Добавить продукт или блюдо"
              chosenFoodTitle={dishChildItem.content?.name}
            />
          }
          content={
            <SearchFood
              mode="products-only"
              onFinish={onFoodAdd}
              currentDishId={null}
              currentProductId={dishChildItem.content?.foodId}
            />
          }
        />

        {dishChildItem.content && (
          <ProductQuantity content={dishChildItem.content} onFinish={() => {}} />
        )}

        <div className={s.finishButton}>
          <Button variant="primary" onClick={handleFinish}>
            Готово
          </Button>
        </div>
      </div>
    </div>
  );
});

export default DishFoodAdd;

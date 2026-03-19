import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFoodButton } from '@/components/features/builders/shared/components/SearchFood';
import Logo from '@/assets/icons/logo.svg';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';
import Button from '@/components/ui/atoms/Button/Button';
import s from './DishFoodAdd.module.scss';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { updateDishItem } from '@/entities/dish';

// TODO: migrate to Triplit — this component still assumes MST-like content shape
type DishItemLike = {
  id: string;
  foodId: string;
  quantity: number;
  food?: { name?: string } | null;
};

type Props = {
  dishChildItem: DishItemLike;
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
    // TODO: migrate to Triplit — update food on dish item
    updateDishItem(dishChildItem.id, { foodId: payload.id });
    setIsSearchExpanded(false);
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <span className={s.headerTitle}>
          <ScreenLabel variant="drawer">Редактировать блюдо</ScreenLabel>
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
              chosenFoodTitle={dishChildItem.food?.name}
            />
          }
          content={
            <SearchFood
              mode="products-only"
              onFinish={onFoodAdd}
              currentDishId={null}
              currentProductId={dishChildItem.foodId}
            />
          }
        />

        {/* TODO: migrate to Triplit — ProductQuantity expects MST content shape */}
        <ProductQuantity content={dishChildItem as any} onFinish={() => {}} />

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

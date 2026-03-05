import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { ColumnLayoutWithFixedHeader } from '@/components/ui/ColumnLayoutWithFixedHeader/index';
import { domainStore } from '@/store/store';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/RootStoreModel';
import { DishItem } from '@/domain/dish/Dish.model';
import { useFilteringStateV2 } from '@/components/features/shared/hooks/useFilteringStateV2';
import Button from '@/components/ui/atoms/Button/Button';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFoodButton } from '@/components/features/builders/shared/components/SearchFood';
import Logo from '@/assets/icons/logo.svg';
import { Instance } from 'mobx-state-tree';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';

type Props = {
  dishChildItem: Instance<typeof DishItem>;
  dishStore?: DishStoreInstance;
  dishId: string;
};

const DishFoodAdd = observer(
  ({ dishId, dishChildItem, dishStore = domainStore.dishStore }: Props) => {
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { toDish } = useAppRoutes();

    const handleFinish = () => {
      dishStore.commitItemDraft(dishId);
      toDish(dishId);
    };

    const onFoodAdd = (payload: { variant: 'dish' | 'product'; id: string }) => {
      if (payload.variant === 'dish') return;
      dishChildItem.updateFood(payload.id);
      setIsSearchExpanded(false);
    };

    return (
      <ColumnLayoutWithFixedHeader
        header={<div />}
        footer={
          <Button variant="primary" onClick={handleFinish}>
            Готово
          </Button>
        }
      >
        <div id="food-section">
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
        </div>
        {dishChildItem.content && (
          <div id="quantity-section">
            <ProductQuantity content={dishChildItem.content} onFinish={() => {}} />
          </div>
        )}
      </ColumnLayoutWithFixedHeader>
    );
  }
);

export default DishFoodAdd;

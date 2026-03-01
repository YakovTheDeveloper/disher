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

type Props = {
  close: () => void;
  dishChildItem: Instance<typeof DishItem>;
  foodStore?: FoodStoreInstance;
  dishStore?: DishStoreInstance;
};

const DishFoodAdd = observer(
  ({
    close,
    dishChildItem,
    foodStore = domainStore.foodStore,
    dishStore = domainStore.dishStore,
  }: Props) => {
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const handleFinish = () => {
      dishStore.commitItemDraft(dishChildItem);
      close();
    };

    const onFoodAdd = (payload: { variant: 'dish' | 'product'; id: string }) => {
      dishChildItem.update(payload.variant, payload.id);
      setIsSearchExpanded(false);
    };

    const filterKeys = ['name'] as const;

    const config = useMemo(
      () =>
        [
          {
            tabName: 'продукты',
            list: foodStore.merged,
            filterKeys,
          },
          {
            tabName: 'блюда',
            list: dishStore.merged,
            filterKeys,
          },
        ] as const,
      [foodStore.merged, dishStore.merged]
    );

    const filterState = useFilteringStateV2(config);

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
                text={dishChildItem.content?.name}
              />
            }
            content={
              <SearchFood
                mode="products"
                onFinish={onFoodAdd}
                currentDishId={dishChildItem.content?.dishId}
                currentProductId={dishChildItem.content?.foodId}
              />
            }
          />
        </div>
        {dishChildItem.content && (
          <div id="quantity-section">
            <ContentEdit.Quantity content={dishChildItem.content} onFinish={() => {}} />
          </div>
        )}
      </ColumnLayoutWithFixedHeader>
    );
  }
);

export default DishFoodAdd;

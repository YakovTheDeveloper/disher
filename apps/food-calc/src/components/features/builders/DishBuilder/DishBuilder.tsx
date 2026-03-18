import { useState } from 'react';
import type { Dish, DishItem } from '@/entities/dish';
import { updateDishName, useDishItems } from '@/entities/dish';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ActionsPanel } from '@/components/features/builders/shared/components/ActionsPanel';
import { DishFoodSelectionActions } from '@/components/features/builders/DishBuilder/components/header-actions/DishFoodSelectionActions';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { SearchFoodInlineModal } from '@/components/features/shared/components/SearchFoodInlineModal';
import { QuantityInlineModal } from '@/components/features/shared/components/QuantityInlineModal';
import styles from './DishBuilder.module.scss';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import EditableText from '@/components/ui/atoms/EditableText/EditableText';
import TextBehind from '@/components/ui/TextBehind/TextBehind';

type Props = {
  init: Dish;
};

const DishBuilder = ({ init }: Props) => {
  const navigate = useNavigate();
  const { results: dishItems } = useDishItems(init.id);
  // 'draft' = adding new item, string = childId for replace-food or edit-quantity
  const [searchContext, setSearchContext] = useState<null | 'draft' | string>(null);
  const [quantityContext, setQuantityContext] = useState<null | 'draft' | string>(null);

  // TODO: migrate to Triplit — find dish item by id from dishItems
  const findItemById = (id: string): DishItem | undefined =>
    dishItems?.find((item) => item.id === id);

  const onFoodSelected = (payload: { variant: 'product' | 'dish'; id: string }) => {
    if (payload.variant === 'dish') return;
    if (searchContext === 'draft') {
      // TODO: implement draft food flow with Triplit
      setSearchContext(null);
      setQuantityContext('draft');
    } else if (searchContext) {
      // TODO: migrate to Triplit — update food on dish item
      // const item = findItemById(searchContext);
      // if (item) updateDishItem(item.id, { foodId: payload.id });
      setSearchContext(null);
    }
  };

  const quantityItem =
    quantityContext === 'draft'
      ? null // TODO: implement draft with Triplit
      : quantityContext
        ? findItemById(quantityContext)
        : null;

  return (
    <SwipeableV2>
      <Screen key={1} offsetTop={false} title={<ScreenLabel variant="screenHeader">Нутриенты</ScreenLabel>}>
        {/* TODO: migrate to Triplit — TotalNutrients needs NutrientsCountableEntity interface */}
        {null}
      </Screen>

      <Screen
        offsetTop
        overlay={
          <>
            <SearchFoodInlineModal
              isOpen={searchContext !== null}
              onSelect={onFoodSelected}
              mode="products-only"
              currentProductId={
                searchContext && searchContext !== 'draft'
                  ? findItemById(searchContext)?.foodId
                  : undefined
              }
            />
            <QuantityInlineModal
              isOpen={quantityContext !== null}
              content={quantityItem ? { quantity: quantityItem.quantity, name: quantityItem.foodId } : null}
              onClose={() => {
                // TODO: implement draft reset with Triplit
                setQuantityContext(null);
              }}
              onCommit={() => {
                // TODO: implement draft commit with Triplit
                setQuantityContext(null);
              }}
              title={quantityContext === 'draft' ? 'Добавить продукт' : 'Количество'}
              commitLabel={quantityContext === 'draft' ? 'Завершить' : 'Готово'}
            />
          </>
        }
        actions={
          <ActionsPanel
            show={true}
            left={
              <button
                onClick={() => {
                  // TODO: implement confirmation drawer with drawerStore.show()
                }}
              >
                удалить
              </button>
            }
          >
            <DishFoodSelectionActions />
          </ActionsPanel>
        }
        key={2}
        title={
          <ScreenLabel
            variant="screenHeader"
            onClick={() => {
              navigate(RouterLinks.ScheduleBuilder);
            }}
          >
            {init.name}
          </ScreenLabel>
        }
        header={
          <TextBehind text="Блюдо">
            <EditableText
              value={init?.name || ''}
              onChange={(val) => updateDishName(init.id, val)}
              className={styles.textInput}
            />
          </TextBehind>
        }
        bottomRight={
          <AddButton
            as="label"
            htmlFor="search"
            onClick={() => setSearchContext('draft')}
          />
        }
      >
        <ItemsList offsetTop>
          {(dishItems ?? []).map((item) => {
            const id = item.id;

            return (
              <CommonListItem
                key={id}
                id={id}
                className={styles.group}
                innerClassName={styles.dishFoodListItem}
                isSelectMode={false}
                isSelected={false}
                onSelect={() => {}}
              >
                <FoodName onClick={() => setSearchContext(id)} content={{ name: item.foodId }} />
                <Quantity id={id} onClick={() => setQuantityContext(id)} hide={false} unit="г" content={{ quantity: item.quantity }} />
              </CommonListItem>
            );
          })}
        </ItemsList>
      </Screen>
    </SwipeableV2>
  );
};

export default DishBuilder;

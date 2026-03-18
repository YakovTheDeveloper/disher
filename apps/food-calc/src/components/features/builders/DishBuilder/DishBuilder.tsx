import { useState } from 'react';
import type { Dish } from '@/entities/dish';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { TotalNutrients } from '@/components/features/builders/TotalNutrients/TotalNutrients';
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
  const dishes = init;
  const navigate = useNavigate();
  // 'draft' = adding new item, string = childId for replace-food or edit-quantity
  const [searchContext, setSearchContext] = useState<null | 'draft' | string>(null);
  const [quantityContext, setQuantityContext] = useState<null | 'draft' | string>(null);

  const onFoodSelected = (payload: { variant: 'product' | 'dish'; id: string }) => {
    if (payload.variant === 'dish') return;
    if (searchContext === 'draft') {
      // TODO: implement draft food flow with Triplit
      setSearchContext(null);
      setQuantityContext('draft');
    } else if (searchContext) {
      dishes.getChildById(searchContext)?.updateFood(payload.id);
      setSearchContext(null);
    }
  };

  const quantityItem =
    quantityContext === 'draft'
      ? null // TODO: implement draft with Triplit
      : quantityContext
        ? dishes.getChildById(quantityContext)
        : null;

  return (
    <SwipeableV2>
      <Screen key={1} title={<ScreenLabel variant="screenHeader">Нутриенты</ScreenLabel>}>
        <TotalNutrients store={dishes} countable={dishes} />
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
                  ? dishes.getChildById(searchContext)?.content?.foodId
                  : undefined
              }
            />
            <QuantityInlineModal
              isOpen={quantityContext !== null}
              content={quantityItem?.content ?? null}
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
              onChange={(val) => init?.changeName(val)}
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
          {dishes.items.map((item) => {
            const content = item.content;
            const id = item.id;

            return (
              <CommonListItem
                key={id}
                id={id}
                className={styles.group}
                innerClassName={styles.dishFoodListItem}
              >
                <FoodName onClick={() => setSearchContext(id)} content={content} />
                <Quantity id={id} onClick={() => setQuantityContext(id)} hide={false} unit="г" content={content} />
              </CommonListItem>
            );
          })}
        </ItemsList>
      </Screen>
    </SwipeableV2>
  );
};

export default DishBuilder;

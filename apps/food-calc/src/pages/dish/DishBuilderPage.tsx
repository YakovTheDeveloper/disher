import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  useDish,
  useDishItems,
  useDishPortions,
  updateDishName,
  removeDishItem,
  addDishPortion,
  updateDishPortion,
  removeDishPortion,
} from '@/entities/dish';
import type { DishItem } from '@/entities/dish';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ActionsPanel } from '@/components/features/builders/shared/components/ActionsPanel';
import { DishFoodSelectionActions } from './components/header-actions/DishFoodSelectionActions';
import { RouterLinks } from '@/router';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import { CountBadge } from '@/components/ui/atoms/Button/CountBadge/CountBadge';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import toaster from '@/infrastructure/toaster/toaster';
import styles from './DishBuilderPage.module.scss';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import EditableText from '@/components/ui/atoms/EditableText/EditableText';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import {
  DishItemCreationModals,
  DISH_MODAL_INPUT_IDS,
  DishItemEditModal,
  DISH_EDIT_MODAL_INPUT_IDS,
  CopyProductsToExistingDishModal,
  CopyProductsToDayScheduleModal,
  COPY_TO_DISH_INPUT_IDS,
} from './ui';
import { FoodsNutrients } from '@/components/widgets/nutrients/FoodsNutrients';
import { FoodPortionsManager } from '@/components/features/food/food-portions-manager';
import { Ornament } from '@/components/ui/Ornament';
import { useDishNutrientTotals } from '@/entities/dish';

type DishItemWithFood = DishItem & { food?: { name: string } | null };

const DishBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    console.error('Dish ID is required but not found in URL');
    return null;
  }

  const { result: dish } = useDish(id);
  const { results: dishItems } = useDishItems(id);
  const { results: portionsRaw } = useDishPortions(id);
  const dishTotals = useDishNutrientTotals(id);

  const selectionStore = useSelection();
  const isActionsMode = useStore(selectionStore, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStore, (s) => s.selectedIds);
  const { clearSelection } = selectionStore.getState();

  const [isOpen, setIsOpen] = useState<'copy-to-existing-dish' | 'copy-to-day-schedule' | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<DishItemWithFood | null>(null);
  const [editingStep, setEditingStep] = useState<'idle' | 'search' | 'quantity'>('idle');

  useSwipeableLock(isOpen !== null || editingItem !== null);

  const closeModal = () => setIsOpen(null);

  const closeEditModal = () => {
    setEditingItem(null);
    setEditingStep('idle');
  };

  const openEditModal = (item: DishItemWithFood, step: 'search' | 'quantity') => {
    setEditingItem(item);
    setEditingStep(step);
  };

  if (!dish) return null;

  const items = (dishItems ?? []) as DishItemWithFood[];

  const getSelectedItems = () => items.filter((item) => selectedIds.includes(item.id));

  const getSelectedItemsForCopy = () =>
    getSelectedItems().map((item) => ({
      id: item.id,
      foodName: item.food?.name ?? '—',
    }));

  const onDeleteSelected = async () => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    await Promise.all(ids.map(removeDishItem));
    clearSelection();
    toaster.success(`Удалено: ${ids.length}`);
  };

  return (
    <SwipeableV2>
      <FoodsNutrients totals={dishTotals} />

      <Screen
        offsetTop
        overlay={
          <>
            <DishItemCreationModals dishId={id} />
            {editingItem && (
              <DishItemEditModal
                item={editingItem}
                initialStep={editingStep}
                onClose={closeEditModal}
              />
            )}
            <CopyProductsToExistingDishModal
              isExpanded={isOpen === 'copy-to-existing-dish'}
              sourceDishId={id}
              items={getSelectedItemsForCopy()}
              onFinish={() => {
                closeModal();
                clearSelection();
              }}
              onClose={closeModal}
            />
            <CopyProductsToDayScheduleModal
              isExpanded={isOpen === 'copy-to-day-schedule'}
              dishId={id}
              items={getSelectedItemsForCopy()}
              onFinish={() => {
                closeModal();
                clearSelection();
              }}
              onClose={closeModal}
            />
          </>
        }
        actions={
          <ActionsPanel
            show={isActionsMode}
            onBack={() => clearSelection()}
            left={<button onClick={onDeleteSelected}>удалить</button>}
          >
            <button onClick={() => setIsOpen('copy-to-day-schedule')}>в расписание</button>
            <label
              onClick={() => setIsOpen('copy-to-existing-dish')}
              htmlFor={COPY_TO_DISH_INPUT_IDS.SEARCH_INPUT}
            >
              в блюдо
            </label>
          </ActionsPanel>
        }
        key={2}
        title={
          <ScreenLabel variant="screenHeader" onClick={() => navigate(RouterLinks.ScheduleBuilder)}>
            {dish.name}
          </ScreenLabel>
        }
        header={
          <TextBehind text="Блюдо">
            <EditableText
              value={dish?.name || ''}
              onChange={(val) => updateDishName(dish.id, val)}
              className={styles.textInput}
            />
          </TextBehind>
        }
        topLeft={selectedIds.length > 0 ? <CountBadge count={selectedIds.length} /> : null}
        bottomRight={
          isActionsMode ? null : (
            <AddButton as="label" htmlFor={DISH_MODAL_INPUT_IDS.SEARCH_INPUT} onClick={() => {}} />
          )
        }
      >
        <ItemsList offsetTop>
          {items.map((item) => (
            <CommonListItem
              key={item.id}
              id={item.id}
              className={styles.group}
              innerClassName={styles.dishFoodListItem}
              isSelectMode={isActionsMode}
              isSelected={selectedIds.includes(item.id)}
              onSelect={() => selectionStore.getState().toggleSelectedId(item.id)}
            >
              <FoodName
                htmlFor={DISH_EDIT_MODAL_INPUT_IDS.SEARCH_INPUT}
                onClick={() => openEditModal(item, 'search')}
                content={{ name: item.food?.name ?? item.foodId }}
              />
              <Quantity
                htmlFor={DISH_EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT}
                id={item.id}
                onClick={() => openEditModal(item, 'quantity')}
                hide={false}
                unit="г"
                content={{ quantity: item.quantity }}
              />
            </CommonListItem>
          ))}
        </ItemsList>
      </Screen>

      <Screen key={3} offsetTop title={<ScreenLabel variant="screenHeader">Порции</ScreenLabel>}>
        <Ornament text="порции" />
        <FoodPortionsManager
          portions={(portionsRaw ?? []).map((p) => ({
            label: p.label,
            amount: p.amount,
            unit: p.unit,
            grams: p.grams,
          }))}
          onAdd={(p) => addDishPortion(id, p)}
          onUpdate={(label, updates) => {
            const portion = portionsRaw?.find((p) => p.label === label);
            if (portion) updateDishPortion(portion.id, updates);
          }}
          onRemove={(label) => {
            const portion = portionsRaw?.find((p) => p.label === label);
            if (portion) removeDishPortion(portion.id);
          }}
        />
      </Screen>
    </SwipeableV2>
  );
};

export default DishBuilderPage;

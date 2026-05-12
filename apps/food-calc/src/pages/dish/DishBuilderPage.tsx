import { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  useDish,
  useDishItemsWithProducts,
  useDishPortions,
  updateDishName,
  removeDishItem,
  addDishPortion,
  updateDishPortion,
  removeDishPortion,
} from '@/entities/dish';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { Screen } from '@/shared/ui/Screen';
import { ScreenLabel } from '@/shared/ui/atoms/Typography/ScreenLabel';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import { RouterLinks } from '@/app/router';
import {
  WriteFoodModals,
  useWriteFoodFlow,
  getWriteFoodInputId,
} from '@/features/food/food-free-text-parse';
import { AddFoodActionBar } from '@/features/food/food-add-action-bar';
import { Swipeable } from '@/shared/ui/Swipeable';
import { SelectableListItem } from '@/features/shared/selectable-list-item';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Quantity } from '@/shared/ui/Quantity';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import styles from './DishBuilderPage.module.scss';
import AddButton from '@/shared/ui/atoms/Button/AddButton/AddButton';
import { ChangeName } from '@/features/shared/change-name';
import { PageHeading } from '@/shared/ui/PageHeading';
import {
  DishProductCreateModals,
  DISH_MODAL_INPUT_IDS,
  DishProductEditModals,
  DISH_EDIT_MODAL_INPUT_IDS,
  DishSuggestionsModal,
  useDishProductFlow,
} from './ui';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { FoodPortionsManager } from '@/features/food/food-portions-manager';
import { Ornament } from '@/shared/ui/Ornament';
import { useDishNutrientTotals } from '@/entities/dish';
import { TopBar } from '@/shared/ui/TopBar';
import Button from '@/shared/ui/atoms/Button/Button';
import { PasteFromClipboardToDishButton } from '@/features/clipboard';

type DishItemWithProduct = { id: string; productId: string; quantity: number; product: { name: string | null } | null };

const DishBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    console.error('Dish ID is required but not found in URL');
    return null;
  }

  const dish = useDish(id);
  const dishItems = useDishItemsWithProducts(id);
  const portionsRaw = useDishPortions(id);
  const dishTotals = useDishNutrientTotals(id);

  const selectionStore = useSelection();
  const isActionsMode = useStore(selectionStore, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStore, (s) => s.selectedIds);
  const { clearSelection } = selectionStore.getState();

  const [isOpen, setIsOpen] = useState<'suggestions' | null>(null);
  const editFlow = useDishProductFlow({ type: 'edit' });

  const writeFoodTarget = useMemo(
    () => ({ kind: 'dish' as const, dishId: id }),
    [id],
  );
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

  useSwipeableLock(isOpen !== null);

  const closeModal = () => setIsOpen(null);

  const startEdit = editFlow.startEdit;
  const handleEditSearch = useCallback(
    (item: DishItemWithProduct) => startEdit(item, 'search'),
    [startEdit]
  );
  const handleEditQuantity = useCallback(
    (item: DishItemWithProduct) => startEdit(item, 'quantity'),
    [startEdit]
  );

  if (!dish) return null;

  const items = dishItems;

  const getSelectedItems = () => items.filter((item) => selectedIds.includes(item.id));

  const onDeleteSelected = async () => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    const results = await Promise.all(
      ids.map((id) => safeMutate(() => removeDishItem(id), 'Не удалось удалить'))
    );
    if (results.some((r) => !r.ok)) return;
    clearSelection();
    toaster.success(`Удалено: ${ids.length}`);
  };

  const onShareSelected = async () => {
    const selected = getSelectedItems();
    if (selected.length === 0) return;

    const payload = selected.map((item) => `${item.productId}:${item.quantity}`).join(',');
    const url = `${window.location.origin}/share?p=${encodeURIComponent(payload)}`;

    try {
      await navigator.clipboard.writeText(url);
      toaster.success('Ссылка скопирована');
      clearSelection();
    } catch {
      toaster.error('Не удалось скопировать ссылку');
    }
  };

  const getExistingItemsForSuggestions = () =>
    items.map((item) => ({
      productId: item.productId,
      name: item.product?.name ?? '',
      quantity: item.quantity,
    }));

  return (
    <Swipeable>
      <FoodsNutrients totals={dishTotals} cardVariant="dish" />

      <Screen
        overlay={
          <>
            <DishProductCreateModals dishId={id} />
            <DishProductEditModals flow={editFlow} />
            <DishSuggestionsModal
              isExpanded={isOpen === 'suggestions'}
              dishId={id}
              dishName={dish.name}
              existingItems={getExistingItemsForSuggestions()}
              onClose={closeModal}
            />
            <WriteFoodModals
              flow={writeFoodFlow}
              inputId={writeFoodInputId}
            />
          </>
        }
        actions={
          <ActionsPanel
            show={isActionsMode}
            onBack={() => clearSelection()}
            left={<button onClick={onDeleteSelected}>удалить</button>}
          >
            <button onClick={onShareSelected}>поделиться</button>
          </ActionsPanel>
        }
        key={2}
        title={
          <ScreenLabel variant="screenHeader" onClick={() => navigate(RouterLinks.ScheduleBuilder)}>
            {dish.name}
          </ScreenLabel>
        }
        topPanel={
          <TopBar>
            {items.length > 0 && (
              <Button variant="menu" onClick={() => setIsOpen('suggestions')}>
                Предложить
              </Button>
            )}
          </TopBar>
        }
        header={
          <ChangeName
            name={dish.name}
            onChangeName={(val) =>
              void safeMutate(() => updateDishName(dish.id, val), 'Не удалось переименовать')
            }
            heading={<PageHeading title={dish.name} subtitle="блюдо" />}
          />
        }
        bottomRight={
          isActionsMode || items.length === 0 ? null : (
            <AddButton as="label" htmlFor={DISH_MODAL_INPUT_IDS.SEARCH_INPUT} onClick={() => {}} />
          )
        }
      >
        <PasteFromClipboardToDishButton dishId={id} wrapperStyle={{ width: '50%' }} />
        {items.length === 0 && (
          <div
            style={{
              padding: 'var(--space-10) var(--space-4) 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <AddButton
              onClick={() => {}}
              as="label"
              htmlFor={DISH_MODAL_INPUT_IDS.SEARCH_INPUT}
              prominent
            >
              Добавить продукт в блюдо
            </AddButton>
            <AddFoodActionBar
              writeFoodFlow={writeFoodFlow}
              writeFoodInputId={writeFoodInputId}
              writeFoodLabel="Опишите ингредиенты..."
              searchHtmlFor={DISH_MODAL_INPUT_IDS.SEARCH_INPUT}
              searchLabel="Продукт"
            />
          </div>
        )}
        {items.length > 0 && !isActionsMode && (
          <div style={{ padding: 'var(--space-2) var(--space-4) 0', display: 'flex', justifyContent: 'flex-end' }}>
            <AddFoodActionBar
              writeFoodFlow={writeFoodFlow}
              writeFoodInputId={writeFoodInputId}
              writeFoodLabel="Опишите ингредиенты..."
              searchHtmlFor={DISH_MODAL_INPUT_IDS.SEARCH_INPUT}
              searchLabel="Продукт"
            />
          </div>
        )}
        <ItemsList offsetTop>
          {items.map((item) => (
            <SelectableListItem
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
                onClick={() => handleEditSearch(item)}
                content={{ name: item.product?.name ?? item.productId }}
              />
              <Quantity
                htmlFor={DISH_EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT}
                id={item.id}
                onClick={() => handleEditQuantity(item)}
                hide={false}
                unit="г"
                content={{ quantity: item.quantity }}
              />
            </SelectableListItem>
          ))}
        </ItemsList>
      </Screen>

      <Screen key={3} title={<ScreenLabel variant="screenHeader">Порции</ScreenLabel>}>
        <Ornament text="порции" />
        <FoodPortionsManager
          portions={portionsRaw.map((p) => ({
            label: p.label,
            grams: p.grams,
          }))}
          onAdd={(p) =>
            void safeMutate(() => addDishPortion(id, p), 'Не удалось добавить порцию')
          }
          onUpdate={(label, updates) => {
            const portion = portionsRaw.find((p) => p.label === label);
            if (portion)
              void safeMutate(
                () => updateDishPortion(portion.id, updates),
                'Не удалось обновить порцию'
              );
          }}
          onRemove={(label) => {
            const portion = portionsRaw.find((p) => p.label === label);
            if (portion)
              void safeMutate(() => removeDishPortion(portion.id), 'Не удалось удалить порцию');
          }}
        />
      </Screen>
    </Swipeable>
  );
};

export default DishBuilderPage;

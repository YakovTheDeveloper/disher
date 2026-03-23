import { useCallback, useState } from 'react';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { BaseDrawerProps } from '@/shared/ui';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { deleteProducts, updateProduct, useProduct } from '@/entities/product';
import { deleteDishes, createDish, addDishItem } from '@/entities/dish';
import { drawerStore } from '@/shared/ui/drawer-store';
import { AddProductToDayScheduleOverlay } from '@/features/daySchedule/add-product-to-day-schedule/AddProductToDayScheduleOverlay';
import { AddDishToDayScheduleOverlay } from '@/features/daySchedule/add-dish-to-day-schedule/AddDishToDayScheduleOverlay';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { TextInput } from '@/shared/ui/atoms/input/TextInput';
import { ButtonBack } from '@/shared/ui/atoms/Button/ButtonBack';
import toaster from '@/shared/lib/toaster/toaster';
import { RouterUrls } from '@/app/router';
import { calculatePricePerKg, priceForWeight } from '@/shared/lib/cost';
import styles from './FoodActionsDrawer.module.scss';

const MODAL_INPUT_IDS = {
  SET_COST: 'food-actions-set-cost',
  ADD_TO_EXISTING_DISH: 'food-actions-add-existing-dish',
  ADD_TO_NEW_DISH: 'food-actions-add-new-dish',
} as const;

interface Props extends BaseDrawerProps {
  variant: 'product' | 'dish';
  itemId: string;
  itemName: string;
  isUserCreated: boolean;
}

type ModalStep = 'idle' | 'setCost' | 'addToExistingDish' | 'addToNewDish';

const FoodActionsDrawer = ({ onClose, variant, itemId, itemName, isUserCreated }: Props) => {
  const { result: product } = useProduct(variant === 'product' ? itemId : undefined);
  const existingPricePerKg = product?.pricePerKg ?? null;

  const [modalStep, setModalStep] = useState<ModalStep>('idle');
  const [costPrice, setCostPrice] = useState(() =>
    existingPricePerKg ? priceForWeight(existingPricePerKg, 100) : 0
  );
  const [costPerGrams, setCostPerGrams] = useState(100);
  const [newDishName, setNewDishName] = useState('');

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const id = (e.target as HTMLElement).id;
    if (id === MODAL_INPUT_IDS.SET_COST) setModalStep('setCost');
    else if (id === MODAL_INPUT_IDS.ADD_TO_EXISTING_DISH) setModalStep('addToExistingDish');
    else if (id === MODAL_INPUT_IDS.ADD_TO_NEW_DISH) setModalStep('addToNewDish');
  }, []);

  const closeModal = () => setModalStep('idle');

  const handleAddToSchedule = () => {
    onClose();
    if (variant === 'product') {
      drawerStore.show(AddProductToDayScheduleOverlay, { productId: itemId });
    } else {
      drawerStore.show(AddDishToDayScheduleOverlay, { dishId: itemId });
    }
  };

  const handleAddToExistingDish = async (payload: { variant: 'product' | 'dish'; id: string }) => {
    await addDishItem({ dishId: payload.id, foodId: itemId, quantity: 100 });
    toaster.success('Добавлено в блюдо');
    closeModal();
    onClose();
  };

  const handleAddToNewDish = async () => {
    const name = newDishName.trim();
    if (!name) return;
    const dishId = await createDish(name);
    await addDishItem({ dishId, foodId: itemId, quantity: 100 });
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
    setNewDishName('');
    closeModal();
    onClose();
  };

  const handleSetCost = async () => {
    if (costPrice <= 0) return;
    const pricePerKg = calculatePricePerKg(costPrice, costPerGrams);
    await updateProduct(itemId, { pricePerKg });
    toaster.success('Стоимость установлена');
    closeModal();
    onClose();
  };

  const handleDelete = async () => {
    if (variant === 'product') {
      await deleteProducts([itemId]);
      toaster.success('Продукт удалён');
    } else {
      await deleteDishes([itemId]);
      toaster.success('Блюдо удалено');
    }
    onClose();
  };

  const typeLabel = variant === 'product' ? 'Продукт' : 'Блюдо';
  const ownerLabel = isUserCreated ? ' \u00B7 ваше' : '';

  return (
    <div onFocusCapture={handleFocusCapture}>
      <DrawerLayout>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <span className={styles.name}>{itemName}</span>
            {isUserCreated && (
              <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
                <TrashIcon />
              </button>
            )}
          </div>
          <span className={styles.meta}>
            {typeLabel}
            {ownerLabel}
          </span>
        </div>
        <div className={styles.actions}>
          {variant === 'product' && (
            <>
              <label htmlFor={MODAL_INPUT_IDS.ADD_TO_EXISTING_DISH} className={styles.actionBtn}>
                <AddToDishIcon />
                Добавить в готовое блюдо
              </label>
              <label htmlFor={MODAL_INPUT_IDS.ADD_TO_NEW_DISH} className={styles.actionBtn}>
                <NewDishIcon />
                Добавить в новое блюдо
              </label>
            </>
          )}
          <button type="button" className={styles.actionBtn} onClick={handleAddToSchedule}>
            <AddToScheduleIcon />
            Добавить в расписание
          </button>
          {variant === 'product' && (
            <label htmlFor={MODAL_INPUT_IDS.SET_COST} className={styles.actionBtn}>
              <CostIcon />
              Установить стоимость
            </label>
          )}
        </div>

        {/* Modal: Add to existing dish */}
        <ModalByLabel
          position="fixed"
          isExpanded={modalStep === 'addToExistingDish'}
          content={
            <div className={styles.modalWrapper}>
              <header className={styles.modalHeader}>
                <ButtonBack size="medium" onClick={closeModal} />
                <span className={styles.modalTitle}>Добавить в блюдо</span>
              </header>
              <SearchFood
                mode="dishes-only"
                onSelectFood={handleAddToExistingDish}
                inputId={MODAL_INPUT_IDS.ADD_TO_EXISTING_DISH}
              />
            </div>
          }
        />

        {/* Modal: Add to new dish */}
        <ModalByLabel
          position="fixed"
          isExpanded={modalStep === 'addToNewDish'}
          content={
            <div className={styles.modalWrapper}>
              <header className={styles.modalHeader}>
                <ButtonBack size="medium" onClick={closeModal} />
                <span className={styles.modalTitle}>Новое блюдо</span>
              </header>
              <div className={styles.modalContent}>
                <TextInput
                  id={MODAL_INPUT_IDS.ADD_TO_NEW_DISH}
                  size="large"
                  placeholder="Название блюда"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddToNewDish()}
                  fullWidth
                />
                <button
                  type="button"
                  className={styles.commitBtn}
                  disabled={!newDishName.trim()}
                  onClick={handleAddToNewDish}
                >
                  Создать и добавить
                </button>
              </div>
            </div>
          }
        />

        {/* Modal: Set cost */}
        <ModalByLabel
          position="fixed"
          isExpanded={modalStep === 'setCost'}
          content={
            <div className={styles.modalWrapper}>
              <header className={styles.modalHeader}>
                <ButtonBack size="medium" onClick={closeModal} />
                <span className={styles.modalTitle}>Стоимость</span>
              </header>
              <div className={styles.modalContent}>
                <div className={styles.costInputRow}>
                  <NumberInput
                    id={MODAL_INPUT_IDS.SET_COST}
                    value={costPrice}
                    onChange={(v) => setCostPrice(v)}
                    placeholder="0"
                  />
                  <span className={styles.costCurrency}>₽</span>
                </div>
                <div className={styles.costPresets}>
                  {[100, 500, 1000].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`${styles.costPresetBtn} ${costPerGrams === g ? styles.costPresetBtn_active : ''}`}
                      onClick={() => setCostPerGrams(g)}
                    >
                      {g >= 1000 ? `${g / 1000} кг` : `${g} г`}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.commitBtn}
                  disabled={costPrice <= 0}
                  onClick={handleSetCost}
                >
                  Сохранить
                </button>
              </div>
            </div>
          }
        />
      </DrawerLayout>
    </div>
  );
};

// ─── Icons ───

const AddToDishIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NewDishIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AddToScheduleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CostIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M9 9.5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2c-1.1 0-2 .9-2 2s.9 2 2 2h2c1.1 0 2-.9 2-2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default FoodActionsDrawer;

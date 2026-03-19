import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchFood from '@/features/food/food-search/SearchFood';
import { OpenFoodCreation } from '@/features/food/open-food-creation';
import { FoodCreationModal } from '@/features/food/food-creation-modal';
import { ButtonBack } from '@/shared/ui/atoms/Button/ButtonBack';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { createProduct } from '@/entities/product';
import { createDish } from '@/entities/dish';
import toaster from '@/shared/lib/toaster/toaster';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';

type CreationType = 'product' | 'dish' | null;

const PRODUCT_INPUT_ID = 'create-product-name';
const DISH_INPUT_ID = 'create-dish-name';

const FoodPage = () => {
  const [searchParams] = useSearchParams();
  const richNutrientId = searchParams.get('richNutrient');
  const richNutrient = useMemo(
    () => (richNutrientId ? allNutrientsList.find((n) => n.id === richNutrientId) : null),
    [richNutrientId]
  );
  const { toScheduleBuilder, toSchedule, toDish, toProduct } = useAppRoutes();
  const [creationType, setCreationType] = useState<CreationType>(null);

  const handleBack = useCallback(() => {
    const lastId = sessionStorage.getItem('lastScheduleBuilderId');
    if (lastId) {
      toScheduleBuilder(lastId);
    } else {
      toSchedule();
    }
  }, [toScheduleBuilder, toSchedule]);

  const handleCreateProduct = useCallback(async (name: string, onDone: () => void) => {
    if (!name) return;
    const productId = await createProduct({ name });
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: `/product/${productId}` },
    });
    onDone();
    setCreationType(null);
  }, []);

  const handleCreateDish = useCallback(async (name: string, onDone: () => void) => {
    if (!name) return;
    const dishId = await createDish(name);
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: `/dish/${dishId}` },
    });
    onDone();
    setCreationType(null);
  }, []);

  const createProductButton = useCallback(
    (name: string, onDone: () => void) => (
      <button
        style={{
          flex: 1,
          padding: '12px 16px',
          background: '#111',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: 'pointer',
        }}
        disabled={!name}
        onClick={() => handleCreateProduct(name, onDone)}
      >
        Создать продукт
      </button>
    ),
    [handleCreateProduct]
  );

  const createDishButton = useCallback(
    (name: string, onDone: () => void) => (
      <button
        style={{
          flex: 1,
          padding: '12px 16px',
          background: '#111',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: 'pointer',
        }}
        disabled={!name}
        onClick={() => handleCreateDish(name, onDone)}
      >
        Создать блюдо
      </button>
    ),
    [handleCreateDish]
  );

  return (
    <>
      <SearchFood
        mode="products-and-dishes"
        sortByNutrientId={richNutrientId}
        sortByNutrientUnit={richNutrient?.unitRu}
        onFinish={({ variant, id }) => {
          if (variant === 'dish') {
            toDish(id);
            return;
          }
          toProduct(id);
        }}
        showMore
        actionLeft={<ButtonBack size="medium" onClick={handleBack} />}
        actionRight={
          <OpenFoodCreation
            onSelect={setCreationType}
            productInputId={PRODUCT_INPUT_ID}
            dishInputId={DISH_INPUT_ID}
          />
        }
      />

      <div style={{ position: 'absolute' }}>
        <FoodCreationModal
          isOpen={creationType === 'product'}
          inputId={PRODUCT_INPUT_ID}
          createButton={createProductButton}
        />
        <FoodCreationModal
          isOpen={creationType === 'dish'}
          inputId={DISH_INPUT_ID}
          createButton={createDishButton}
        />
      </div>
    </>
  );
};

export default FoodPage;

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import SearchFood from '@/components/features/builders/shared/components/SearchFood/SearchFood';
import { OpenFoodCreation } from '@/components/features/food/open-food-creation';
import { FoodCreationModal } from '@/components/features/food/food-creation-modal';
import { ButtonBack } from '@/components/ui/atoms/Button/ButtonBack';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { productFactory } from '@/domain/product/Food.factory';
import { DishFactory } from '@/store/DishStore/Dish.factory';
import { domainStore } from '@/store/store';
import toaster from '@/infrastructure/toaster/toaster';
import { allNutrientsList } from '@/components/entities/nutrient/NutrientGroup/constants';

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

  const handleCreateProduct = useCallback((name: string, onDone: () => void) => {
    if (!name) return;
    const product = productFactory.createNewLocal({
      name,
      nutrients: [],
      portions: [],
      description: '',
    });
    domainStore.foodStore.insert(product);
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: `/product/${product.id}` },
    });
    onDone();
    setCreationType(null);
  }, []);

  const handleCreateDish = useCallback((name: string, onDone: () => void) => {
    if (!name) return;
    const dish = DishFactory.createNewLocal({ name, description: '', userId: 0 });
    domainStore.dishStore.insert(dish);
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: `/dish/${dish.id}` },
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
        showAdd
        showDelete
        actionLeft={<ButtonBack size="small" onClick={handleBack} />}
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

export default observer(FoodPage);

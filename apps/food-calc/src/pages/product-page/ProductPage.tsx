import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { FoodEntityView, foodToViewable } from '@/components/widgets/food-entity-view';
import styles from './ProductPage.module.scss';

const ProductPage = () => {
  const { id } = useParams<'id'>();
  const food = id ? domainStore.foodStore.getEntity(id) : undefined;

  if (!food) return null;

  const entity = foodToViewable(food);

  const nutrientEditable = food.createdByUser
    ? {
        getNutrientValue: (nutrientId: string) =>
          food.nutrientsMap.get(nutrientId)?.quantity || 0,
        changeNutrientValue: (nutrientId: string, value: number) =>
          food.changeNutrientValue(nutrientId, value),
      }
    : undefined;

  return (
    <FoodEntityView
      entity={entity}
      mstEntity={food}
      nutrientEditable={nutrientEditable}
      title="Продукт"
      quantityInputClassName={styles.quantityInput}
    />
  );
};

export default observer(ProductPage);

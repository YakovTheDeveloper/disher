import { useParams } from 'react-router-dom';
import { useProduct, setProductNutrient } from '@/entities/product';
import { FoodEntityView, foodToViewable } from '@/components/widgets/food-entity-view';
import styles from './ProductPage.module.scss';

const ProductPage = () => {
  const { id } = useParams<'id'>();
  const { result: food } = useProduct(id);

  if (!food) return null;

  const entity = foodToViewable({
    id: food.id,
    name: food.name,
    description: food.description ?? undefined,
    createdByUser: true, // TODO: determine from food data if needed
    portions: [],
    nutrientsMap: new Map(),
  });

  const nutrientEditable = {
    getNutrientValue: (_nutrientId: string) => 0,
    changeNutrientValue: (nutrientId: string, value: number) => {
      setProductNutrient(food.id, nutrientId, value);
    },
  };

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

export default ProductPage;

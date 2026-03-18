import { useParams } from 'react-router-dom';
import { useProduct, setProductNutrient, updateProduct } from '@/entities/product';
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
    getTotalNutrients: (_quantity?: number) => ({}), // TODO: migrate to Triplit
    changeName: (name: string) => updateProduct(food.id, { name }),
    changeDescription: (description: string | undefined) => updateProduct(food.id, { description: description ?? '' }),
    addPortion: () => {}, // TODO: migrate to Triplit
    updatePortion: () => {}, // TODO: migrate to Triplit
    removePortion: () => {}, // TODO: migrate to Triplit
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

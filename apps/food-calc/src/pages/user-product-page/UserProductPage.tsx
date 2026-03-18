import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { useParams } from 'react-router-dom';
import { useProduct, updateProduct, setProductNutrient } from '@/entities/product';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { HeaderInputName } from '@/components/features/builders/shared/components/HeaderInputName';
import ChangeProductNutrientValue from '@/components/features/product/change-product-nutrient-value/ChangeProductNutrientValue';

const UserProductPage = () => {
  const { id } = useParams<'id'>();
  const { result: userFood } = useProduct(id);

  if (!userFood) return null;

  const onNutrientChange = (value: number, nutrientId: string) =>
    setProductNutrient(userFood.id, nutrientId, value);

  const getValue = (_nutrientId: string) => {
    // TODO: use useProductNutrients hook for reactive nutrient values
    return 0;
  };

  const entityForHeader = {
    name: userFood.name,
    changeName: (name: string) => updateProduct(userFood.id, { name }),
  };

  return (
    <Screen
      offsetTop
      title={<ScreenLabel variant="screenHeader">Продукт</ScreenLabel>}
      header={<HeaderInputName entity={entityForHeader} asInput={true} />}
    >
      <Spacer variant="screen-header-offset" />
      <label>
        <Textarea
          value={userFood?.description || ''}
          onChange={(val) => updateProduct(userFood.id, { description: val || '' })}
        />
      </label>
      <Nutrients
        renderCard={(nutrientData) => (
          <ChangeProductNutrientValue
            content={nutrientData}
            getValue={getValue}
            onChange={onNutrientChange}
          />
        )}
      />
    </Screen>
  );
};

export default UserProductPage;

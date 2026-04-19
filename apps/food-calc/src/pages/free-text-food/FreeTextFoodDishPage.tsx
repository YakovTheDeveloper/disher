import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FreeTextFoodFlow from './FreeTextFoodFlow';
import type { FreeTextFoodMode } from './mode';

const FreeTextFoodDishPage = () => {
  const { dishId } = useParams<{ dishId: string }>();
  const navigate = useNavigate();

  const mode = useMemo<FreeTextFoodMode | null>(
    () => (dishId ? { kind: 'dish', dishId } : null),
    [dishId],
  );

  if (!mode) {
    navigate('/');
    return null;
  }

  return <FreeTextFoodFlow mode={mode} />;
};

export default FreeTextFoodDishPage;

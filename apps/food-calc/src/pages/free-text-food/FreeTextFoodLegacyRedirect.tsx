import { Navigate, useParams } from 'react-router-dom';

const FreeTextFoodLegacyRedirect = () => {
  const { date } = useParams<{ date: string }>();
  if (!date) return <Navigate to="/" replace />;
  return <Navigate to={`/free-text-food/schedule/${date}`} replace />;
};

export default FreeTextFoodLegacyRedirect;

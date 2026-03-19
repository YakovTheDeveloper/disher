import { observer } from 'mobx-react-lite';
import { Button } from '@/shared/ui/atoms/Button';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  children: React.ReactNode;
};

const OpenFoods = ({ children }: Props) => {
  const { toFood } = useAppRoutes();

  return (
    <Button variant="ghost" onClick={toFood}>
      {children}
    </Button>
  );
};

export default observer(OpenFoods);

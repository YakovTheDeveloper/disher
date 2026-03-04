import { observer } from 'mobx-react-lite';
import { Button } from '@/components/ui/atoms/Button';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  children?: React.ReactNode;
};

const OpenProducts = ({}: Props) => {
  const { toProducts } = useAppRoutes();

  return (
    <Button variant="ghost" onClick={toProducts}>
      Открыть продукты
    </Button>
  );
};

export default observer(OpenProducts);

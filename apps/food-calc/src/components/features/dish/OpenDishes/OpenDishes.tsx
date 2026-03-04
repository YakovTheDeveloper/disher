import { observer } from 'mobx-react-lite';
import { Button } from '@/components/ui/atoms/Button';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  children: React.ReactNode;
};

const OpenDishes = ({ children }: Props) => {
  const { toDishes } = useAppRoutes();

  return (
    <Button variant="ghost" onClick={toDishes}>
      Открыть блюда
    </Button>
  );
};

export default observer(OpenDishes);

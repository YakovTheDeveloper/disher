import { observer } from 'mobx-react-lite';
import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import { ListDailyNorms } from '@/components/features/lists/ListDailyNorms';

type Props = {
  onClose: () => void;
};

const DrawerChooseDailyNorm = ({ onClose: _onClose }: Props) => {
  return (
    <DrawerLayout>
      <ListDailyNorms />
    </DrawerLayout>
  );
};

export default observer(DrawerChooseDailyNorm);

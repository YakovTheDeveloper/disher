import { observer } from 'mobx-react-lite';
import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import { ListDailyNorms } from '@/components/features/lists/ListDailyNorms';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { DrawerProps } from '@/types/common/drawer.v2';

type Props = DrawerProps;

const DrawerChooseDailyNorm = ({ onClose }: Props) => {
  return (
    <DrawerLayout label={<ScreenLabel variant="drawer">Выбрать норму</ScreenLabel>}>
      <ListDailyNorms onSelect={() => {}} />
    </DrawerLayout>
  );
};

export default observer(DrawerChooseDailyNorm);

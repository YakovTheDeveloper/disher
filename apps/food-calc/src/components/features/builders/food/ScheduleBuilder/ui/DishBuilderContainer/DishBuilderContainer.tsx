import { observer } from 'mobx-react-lite';
import styles from './DishBuilderContainer.module.scss';
import {
  DishBuilder,
  DishBuilderOnUniteProducts,
} from '@/components/features/builders/food/DishBuilder';
import DishCreatingStore from '@/components/features/builders/food/ScheduleBuilder/model/CreateDishViewModel';
import { DishBuilderViewModel } from '@/components/features/builders/food/DishBuilder/model/DishBuilderViewModel';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
type Props = {
  children?: React.ReactNode;
  store: Instance<typeof DaySchedule>;
};

const DishBuilderContainer = ({ store, children }: Props) => {
  const modals = useDailyScheduleModals();

  if (!store?.tempDishFromFood) return null;

  const onFinish = async () => {
    store.saveDishFromTempAndReset();
    modals.close();
  };

  return (
    <div className={styles.container}>
      <DishBuilderOnUniteProducts init={store.tempDishFromFood} onFinish={onFinish} />
    </div>
  );
};

export default observer(DishBuilderContainer);

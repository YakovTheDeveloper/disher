import { observer } from 'mobx-react-lite';
import styles from './DishBuilderContainer.module.scss';
import { DishBuilder } from '@/components/blocks/builders/food/DishBuilder';
import DishCreatingStore from '@/components/blocks/builders/food/ScheduleBuilder/model/CreateDishViewModel';
import { DishBuilderViewModel } from '@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel';
type Props = {
  children?: React.ReactNode;
  store: DishCreatingStore;
};

const DishBuilderContainer = ({ store, children }: Props) => {
  const vm = store.vm;

  if (!vm) return null;

  return (
    <div className={styles.container}>
      <DishBuilder finishButtonTitle="Обьединить" init={vm} onFinish={store.onFinish} />
    </div>
  );
};

export default observer(DishBuilderContainer);

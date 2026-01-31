import { observer } from 'mobx-react-lite';
import styles from './DrawerChooseDailyNorm.module.scss';
import { ListDailyNorms } from '@/components/features/lists/ListDailyNorms';
type Props = {
  children: React.ReactNode;
};

const DrawerChooseDailyNorm = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <ListDailyNorms />
    </div>
  );
};

export default observer(DrawerChooseDailyNorm);

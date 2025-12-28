import { observer } from 'mobx-react-lite';
import styles from './dailyNormsPage.module.scss';
import { DailyNorms } from '@/components/features/DailyNorms';
import { useCallback } from 'react';
import { dailyNormModelStore } from '@/store/rootStore';
type Props = {
  children: React.ReactNode;
};

const DailyNormsPage = ({ children }: Props) => {
  const getNormsModelStore = useCallback(() => dailyNormModelStore, []);

  const init = dailyNormModelStore.dataCollection;

  return (
    <div className={styles.container}>
      <DailyNorms init={init} />
    </div>
  );
};

export default observer(DailyNormsPage);

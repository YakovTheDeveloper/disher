import { observer } from 'mobx-react-lite';
import styles from './dailyNormsPage.module.scss';
import { ListDailyNorms } from '@/components/features/lists/ListDailyNorms';
type Props = {
  children: React.ReactNode;
};

const DailyNormsPage = ({ children }: Props) => {
  return <ListDailyNorms />;
};

export default observer(DailyNormsPage);

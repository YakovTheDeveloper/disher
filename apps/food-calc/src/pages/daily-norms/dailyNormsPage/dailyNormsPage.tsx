import { observer } from 'mobx-react-lite';
import styles from './dailyNormsPage.module.scss';
import { DailyNorms } from '@/components/features/DailyNorms';
type Props = {
  children: React.ReactNode;
};

const DailyNormsPage = ({ children }: Props) => {
  return <DailyNorms />;
};

export default observer(DailyNormsPage);

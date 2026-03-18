import { observer } from 'mobx-react-lite';
import './dailyNormsPage.module.scss';
import { ListDailyNorms } from '@/components/features/lists/ListDailyNorms';
type Props = {
  children?: React.ReactNode;
};

const DailyNormsPage = ({ children: _children }: Props) => {
  return <ListDailyNorms />;
};

export default observer(DailyNormsPage);

import { observer } from 'mobx-react-lite';
import styles from './DishesPage.module.scss';
import { Dishes } from '@/components/features/builders/food/Dishes';
type Props = {
  children: React.ReactNode;
};

const DishesPage = ({ children }: Props) => {
  return <Dishes></Dishes>;
};

export default observer(DishesPage);

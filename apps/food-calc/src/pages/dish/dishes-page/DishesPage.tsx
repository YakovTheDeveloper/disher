import { observer } from 'mobx-react-lite';
import styles from './DishesPage.module.scss';
import { ListDishes } from '@/components/features/lists/ListDishes';
type Props = {
  children?: React.ReactNode;
};

const DishesPage = ({}: Props) => {
  return <ListDishes></ListDishes>;
};

export default observer(DishesPage);

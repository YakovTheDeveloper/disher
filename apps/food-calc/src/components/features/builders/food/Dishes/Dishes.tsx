import { observer } from 'mobx-react-lite';
import styles from './Dishes.module.scss';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
type Props = {
  children: React.ReactNode;
};

const Dishes = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <ItemsList>
        <CommonListItem></CommonListItem>
      </ItemsList>
    </div>
  );
};

export default observer(Dishes);

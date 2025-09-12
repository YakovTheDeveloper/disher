import { observer } from 'mobx-react-lite';
import styles from './List.module.scss';
import { UICollectionItem } from '@/components/blocks/builders/food/ScheduleBuilder/model/SearchViewModel';
import clsx from 'clsx';
import { CommonData } from '@/store/models/common/types';
type Props = {
  content: {
    filtered: UICollectionItem[];
    filterText: string;
    setFilterText: (text: string) => void;
  };
  onFoodSelect: (content: CommonData | null, variant: 'dish' | 'food') => void;
  vm: {
    selectedItemId?: {
      variant: string;
      id: number;
    };
  };
};

const List = ({ onFoodSelect, content, vm }: Props) => {
  return (
    <ul className={styles.list}>
      {content.filtered.map(({ id, name, uid, type }) => (
        <li
          key={uid}
          className={clsx([
            styles.listItem,
            vm.selectedItemId?.variant === type &&
              vm.selectedItemId?.id === id &&
              styles.listItem_active,
          ])}
          onClick={() => onFoodSelect({ id, name }, type)}
        >
          {name}
        </li>
      ))}
    </ul>
  );
};

export default observer(List);

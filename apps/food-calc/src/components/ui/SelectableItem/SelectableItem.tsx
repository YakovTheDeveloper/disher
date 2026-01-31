import { observer } from 'mobx-react-lite';
import styles from './SelectableItem.module.scss';
import clsx from 'clsx';

type Props = {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  innerClassName?: string;
};

const SelectableItem = ({ id, children, isSelected, onSelect, innerClassName }: Props) => {
  return (
    <div className={clsx([styles.item, isSelected && styles.selected])}>
      <div className={clsx([styles.innerListItem, innerClassName])}>{children}</div>
      <button
        onClick={(e) => {
          onSelect(id);
          e.stopPropagation();
        }}
        className={clsx([styles.selectButton])}
      />
    </div>
  );
};

export default observer(SelectableItem);

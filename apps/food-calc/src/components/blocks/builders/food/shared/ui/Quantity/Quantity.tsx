import { observer } from 'mobx-react-lite';
import styles from './Quantity.module.scss';
import { spy } from 'mobx';
type Props = {
  children: () => React.ReactNode;
  id: string | number;
  onClick: (id: string | number) => void;
  className?: string;
  hide: boolean;
};

const Quantity = ({ id, onClick, children, hide }: Props) => {
  console.log('LIST_ITEM_QUANTIY');

  const onClickHandler = () => onClick(id);
  return (
    <p onClick={onClickHandler} className={`${styles.container} ${hide ? styles.hide : ''}`}>
      {children()}
    </p>
  );
};

export default observer(Quantity);

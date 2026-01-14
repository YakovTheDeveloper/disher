import { observer } from 'mobx-react-lite';
import styles from './ModalCreateDish.module.scss';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
type Props = {
  modalStore: ModalStoreInstance;
};

const ModalCreateDish = ({ modalStore }: Props) => {
  return <div className={styles.container}>ModalCreateDish</div>;
};

export default observer(ModalCreateDish);

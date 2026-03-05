import { BaseDrawerProps } from '@/store/GlobalUiStore/DrawerStoreV3/types';
import styles from './AddProductToDishOverlay.module.scss';

interface Props extends BaseDrawerProps {
  productId: string;
}

const AddProductToDishOverlay = ({ productId, onClose }: Props) => {
  return (
    <div className={styles.container}>
      AddProductToDishOverlay
      <button type="button" onClick={() => onClose()}>
        Close
      </button>
    </div>
  );
};

export default AddProductToDishOverlay;

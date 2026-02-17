import { observer } from 'mobx-react-lite';
import styles from './ModalSearchFood.module.scss';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { domainStore } from '@/store/store';
import { useOverlay } from '@/store/GlobalUiStore/OverlayStore';
import { BaseModalProps } from '@/store/GlobalUiStore/ModalStoreV2/types';
import { ModalLayout } from '@/components/features/builders/shared/components/ModalLayout';
import ArrowLeftIcon from '@/assets/icons/arrowLeftLong.svg';

interface ModalSearchFoodProps extends BaseModalProps {
  // Можно добавить пропсы для предварительного выбора продукта/блюда
  productId?: string;
  dishId?: string;
}

const ModalSearchFood = observer(({ productId, dishId, onClose }: ModalSearchFoodProps) => {
  return (
    <ModalLayout>
      <SearchFood
        mode="products-and-dishes"
        onFinish={onClose}
        currentDishId={dishId}
        currentProductId={productId}
        beforeSearchInput={
          <button className={styles.backButton}>
            <ArrowLeftIcon />
          </button>
        }
      />
    </ModalLayout>
  );
});

export default ModalSearchFood;

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/components/features/builders/shared/components/ModalLayout';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';

interface ModalSearchFoodProps extends BaseModalProps {
  productId?: string;
  dishId?: string;
}

const ModalSearchFoodContent = observer(({ productId, dishId, onClose }: ModalSearchFoodProps) => {
  const handleFoodAdd = useCallback(
    (payload: { id: string }) => {
      onClose({ id: payload.id, variant: 'product' });
    },
    [onClose]
  );

  const handleDishAdd = useCallback(
    (payload: { id: string }) => {
      onClose({ id: payload.id, variant: 'dish' });
    },
    [onClose]
  );

  return (
    <SearchFormExpandable
      isExpanded={true}
      trigger={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f5f5f5',
            borderRadius: 8,
            padding: '8px 12px',
            width: '100%',
          }}
        >
          <span style={{ marginRight: 8 }}>🔍</span>
          <span style={{ color: '#999' }}>Поиск продуктов и блюд...</span>
        </div>
      }
      content={
        <SearchFood
          mode="products-and-dishes"
          onFinish={(payload) => {
            if (payload.variant === 'product') {
              handleFoodAdd({ id: payload.id });
            } else {
              handleDishAdd({ id: payload.id });
            }
          }}
          currentDishId={dishId}
          currentProductId={productId}
        />
      }
    />
  );
});

const ModalSearchFood = observer(({ productId, dishId, onClose }: ModalSearchFoodProps) => {
  return (
    <ModalLayout>
      <ModalSearchFoodContent productId={productId} dishId={dishId} onClose={onClose} />
    </ModalLayout>
  );
});

export default ModalSearchFood;

import React from 'react';
import { DrawerProps } from '@/types/common/drawer.v2';
import { Drawer } from '@/components/ui/Drawer/Drawer';
import { domainStore } from '@/store/store';

export interface ConfirmationPayload {
  action: string;
  onConfirm: () => void;
}

export const ConfirmationRemoveDishesDrawerV2: React.FC<DrawerProps<ConfirmationPayload>> = ({
  payload,
  onClose,
}) => {
  const { action, onConfirm } = payload ?? {};

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Drawer open={true} onClose={onClose} title="Подтвердите действие">
      <div style={{ padding: '16px' }}>
        <p>Вы уверены, что хотите {action}</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px' }}>
            Отменить
          </button>
          <button onClick={handleConfirm} style={{ flex: 1, padding: '12px' }}>
            Подтвердить
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default ConfirmationRemoveDishesDrawerV2;

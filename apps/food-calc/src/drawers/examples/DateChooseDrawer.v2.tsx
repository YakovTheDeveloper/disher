/**
 * Example V2 Drawer - DateChoose
 * Demonstrates the new lazy loading pattern
 */

import React from 'react';
import { DrawerProps } from '@/types/common/drawer.v2';
import { Drawer } from '@/components/ui/Drawer/Drawer';

// Example payload type
export interface DateChoosePayload {
  initialDate?: string;
  onSelect?: (date: string) => void;
}

// V2 Drawer component with standardized props
export const DateChooseDrawerV2: React.FC<DrawerProps<DateChoosePayload>> = ({
  payload,
  onClose,
}) => {
  const { initialDate, onSelect } = payload ?? {};
  const [selectedDate, setSelectedDate] = React.useState(initialDate ?? new Date().toISOString());

  const handleConfirm = () => {
    onSelect?.(selectedDate);
    onClose();
  };

  return (
    <Drawer open={true} onClose={onClose} title="Выберите дату">
      <div style={{ padding: '16px' }}>
        <p>Selected: {selectedDate}</p>
        <input
          type="date"
          value={selectedDate.split('T')[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '16px' }}
        />
        <button onClick={handleConfirm} style={{ width: '100%' }}>
          Подтвердить
        </button>
      </div>
    </Drawer>
  );
};

export default DateChooseDrawerV2;

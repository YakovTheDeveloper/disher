import { useState, useCallback, useRef, useEffect } from 'react';
import type { Portion } from '@/features/product/ProductQuantity';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import DrawerLayout from '@/shared/ui/DrawerLayout/DrawerLayout';
import FoodPortionsManager from './FoodPortionsManager';

type Props = BaseDrawerProps & {
  portions: Portion[];
  onSave: (portions: Portion[]) => Promise<void>;
};

const PortionsDrawer = ({ onClose: _onClose, portions, onSave }: Props) => {
  const [draft, setDraft] = useState<Portion[]>(portions);
  const draftRef = useRef(draft);
  const initialRef = useRef(portions);
  draftRef.current = draft;

  // Auto-save on unmount if dirty
  useEffect(() => {
    return () => {
      if (JSON.stringify(draftRef.current) !== JSON.stringify(initialRef.current)) {
        onSave(draftRef.current);
      }
    };
  }, [onSave]);

  const handleAdd = useCallback((portion: Portion) => {
    setDraft((prev) => [...prev, portion]);
  }, []);

  const handleUpdate = useCallback((label: string, updates: Partial<Portion>) => {
    setDraft((prev) =>
      prev.map((p) => (p.label === label ? { ...p, ...updates } : p)),
    );
  }, []);

  const handleRemove = useCallback((label: string) => {
    setDraft((prev) => prev.filter((p) => p.label !== label));
  }, []);

  return (
    <DrawerLayout>
      <FoodPortionsManager
        portions={draft as any}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
      />
    </DrawerLayout>
  );
};

export default PortionsDrawer;

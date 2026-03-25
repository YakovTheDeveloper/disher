import { useState, useCallback, useRef, useEffect } from 'react';
import type { Portion } from '@triplit-schema/constants/portions';
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

  const handleUpdate = useCallback((index: number, updates: Partial<Portion>) => {
    setDraft((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  }, []);

  const handleRemove = useCallback((index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <DrawerLayout>
      <FoodPortionsManager
        portions={draft}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
      />
    </DrawerLayout>
  );
};

export default PortionsDrawer;

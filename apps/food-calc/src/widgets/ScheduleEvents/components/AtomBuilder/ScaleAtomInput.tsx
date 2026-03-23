/**
 * ScaleAtomInput - Input component for scale atoms (1-10 ratings)
 */

import { useState } from 'react';
import { ScaleAtom } from '@/entities/schedule-event';
import { AtomInputLayout, AtomActionButtons, PresetChips } from './shared';

export interface ScaleAtomInputProps {
  onAddAtom: (atom: ScaleAtom) => void;
  onClose: () => void;
  accentColor?: string;
}

const PRESET_LABELS = ['боль', 'настроение', 'энергия', 'стресс', 'тревога', 'нагрузка'];

/**
 * ScaleAtomInput Component
 *
 * Allows user to add a scale atom (1-10 rating)
 */
export const ScaleAtomInput = ({ onAddAtom, onClose, accentColor }: ScaleAtomInputProps) => {
  const [value, setValue] = useState(5);
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    onAddAtom({
      kind: 'scale',
      value,
      label: label || undefined,
    });
  };

  return (
    <AtomInputLayout title="Добавить оценку" accentColor={accentColor}>
      <div>
        <label>Оценка (1-10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <output>{value}</output>
      </div>

      <div>
        <label>Для чего? (опционально)</label>
        <input
          type="text"
          placeholder="боль, настроение, энергия..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <PresetChips presets={PRESET_LABELS} value={label} onChange={setLabel} />
      </div>

      <AtomActionButtons onCancel={onClose} onAdd={handleAdd} />
    </AtomInputLayout>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';

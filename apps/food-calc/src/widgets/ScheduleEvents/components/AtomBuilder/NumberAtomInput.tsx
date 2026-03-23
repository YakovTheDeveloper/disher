/**
 * NumberAtomInput - Input component for number atoms
 */

import { useState } from 'react';
import { NumberAtom } from '@/entities/schedule-event';
import { AtomInputLayout, AtomActionButtons, PresetChips } from './shared';

export interface NumberAtomInputProps {
  onAddAtom: (atom: NumberAtom) => void;
  onClose: () => void;
  accentColor?: string;
}

const PRESET_UNITS = ['км', 'м', 'бпм', '°C', 'мг', 'шаги', 'ккал', 'г'];

/**
 * NumberAtomInput Component
 *
 * Allows user to add a number atom with optional unit and label
 */
export const NumberAtomInput = ({ onAddAtom, onClose, accentColor }: NumberAtomInputProps) => {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!value || isNaN(Number(value))) {
      alert('Пожалуйста, введите число');
      return;
    }

    onAddAtom({
      kind: 'number',
      value: Number(value),
      unit: unit || undefined,
      label: label || undefined,
    });
  };

  return (
    <AtomInputLayout title="Добавить число" accentColor={accentColor}>
      <div>
        <label>Значение</label>
        <input
          type="number"
          placeholder="5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      {value && (
        <>
          <div>
            <label>Единица измерения (опционально)</label>
            <input
              type="text"
              placeholder="км, бпм, °C..."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <PresetChips presets={PRESET_UNITS} value={unit} onChange={setUnit} />
          </div>

          <div>
            <label>Описание (опционально)</label>
            <input
              type="text"
              placeholder="дальность, пульс, температура..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        </>
      )}

      <AtomActionButtons onCancel={onClose} onAdd={handleAdd} addDisabled={!value} />
    </AtomInputLayout>
  );
};

NumberAtomInput.displayName = 'NumberAtomInput';

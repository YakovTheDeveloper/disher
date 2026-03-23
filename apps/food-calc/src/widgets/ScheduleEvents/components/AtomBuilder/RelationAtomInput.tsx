/**
 * RelationAtomInput - Input component for relation atoms
 */

import { useState } from 'react';
import { RelationAtom } from '@/entities/schedule-event';
import { AtomInputLayout, AtomActionButtons, PresetChips } from './shared';

export interface RelationAtomInputProps {
  onAddAtom: (atom: RelationAtom) => void;
  onClose: () => void;
  accentColor?: string;
}

const PRESET_RELATIONS = [
  'из-за стресса',
  'после тренировки',
  'связано с работой',
  'после еды',
  'из-за плохого сна',
  'на фоне болезни',
];

/**
 * RelationAtomInput Component
 *
 * Allows user to add a relation atom expressing causality or connection
 */
export const RelationAtomInput = ({ onAddAtom, onClose, accentColor }: RelationAtomInputProps) => {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      alert('Пожалуйста, введите связь');
      return;
    }

    onAddAtom({
      kind: 'relation',
      value: trimmed,
    });
  };

  return (
    <AtomInputLayout
      title="Добавить связь"
      description="Выразите причину или связь с другим событием"
      accentColor={accentColor}
    >
      <div>
        <label>Связь</label>
        <textarea
          placeholder="из-за стресса, после тренировки, связано с работой..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <label>Примеры</label>
        <PresetChips presets={PRESET_RELATIONS} value={value} onChange={setValue} />
      </div>

      <AtomActionButtons onCancel={onClose} onAdd={handleAdd} addDisabled={!value.trim()} />
    </AtomInputLayout>
  );
};

RelationAtomInput.displayName = 'RelationAtomInput';

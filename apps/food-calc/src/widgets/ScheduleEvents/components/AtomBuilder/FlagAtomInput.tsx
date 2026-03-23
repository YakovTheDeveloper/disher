/**
 * FlagAtomInput - Input component for flag atoms
 */

import { useState } from 'react';
import { FlagAtom } from '@/entities/schedule-event';
import { AtomInputLayout, AtomActionButtons } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface FlagAtomInputProps {
  onAddAtom: (atom: FlagAtom) => void;
  onClose: () => void;
  accentColor?: string;
}

const PRESET_FLAGS = [
  { value: 'important', label: '⭐ Важно' },
  { value: 'urgent', label: '🔴 Срочно' },
  { value: 'recurring', label: '🔄 Повторяется' },
  { value: 'chronic', label: '⏱️ Хроническое' },
  { value: 'needs-attention', label: '👁️ Требует внимания' },
  { value: 'reminder-needed', label: '⏰ Нужен напоминание' },
];

/**
 * FlagAtomInput Component
 *
 * Allows user to add a flag atom expressing a binary state or marker
 */
export const FlagAtomInput = ({ onAddAtom, onClose, accentColor }: FlagAtomInputProps) => {
  const [customValue, setCustomValue] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);

  const handleAdd = () => {
    const flagValue = selectedFlag || customValue.trim();

    if (!flagValue) {
      alert('Пожалуйста, выберите или введите флаг');
      return;
    }

    onAddAtom({
      kind: 'flag',
      value: flagValue,
    });
  };

  return (
    <AtomInputLayout
      title="Добавить флаг"
      description="Выберите одно из предложенных или введите свое"
      accentColor={accentColor}
    >
      <div>
        <label>Готовые флаги</label>
        <div className={styles.presetLabels}>
          {PRESET_FLAGS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`${styles.presetChip} ${selectedFlag === value ? styles.active : ''}`}
              onClick={() => {
                setSelectedFlag(value);
                setCustomValue('');
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label>Или введите свой флаг</label>
        <input
          type="text"
          placeholder="например: 'требует лечения'"
          value={customValue}
          onChange={(e) => {
            setCustomValue(e.target.value);
            setSelectedFlag(null);
          }}
        />
      </div>

      <AtomActionButtons
        onCancel={onClose}
        onAdd={handleAdd}
        addDisabled={!selectedFlag && !customValue.trim()}
      />
    </AtomInputLayout>
  );
};

FlagAtomInput.displayName = 'FlagAtomInput';

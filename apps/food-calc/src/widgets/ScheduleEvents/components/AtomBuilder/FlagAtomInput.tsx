/**
 * FlagAtomInput - Fullscreen input for flag atoms
 *
 * Preset flags first — one tap to select and done.
 * Custom input hidden behind "Свой" toggle for less common use.
 */

import { useState } from 'react';
import { FlagAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { AtomModalFooter } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface FlagAtomInputProps {
  onAddAtom: (atom: FlagAtom) => void;
  onClose: () => void;
  accentColor?: string;
  inputId?: string;
}

const PRESET_FLAGS = [
  { value: 'important', label: '⭐ Важно' },
  { value: 'urgent', label: '🔴 Срочно' },
  { value: 'recurring', label: '🔄 Повторяется' },
  { value: 'chronic', label: '⏱️ Хроническое' },
  { value: 'needs-attention', label: '👁️ Требует внимания' },
  { value: 'reminder-needed', label: '⏰ Нужен напоминание' },
];

export const FlagAtomInput = ({ onAddAtom, onClose, accentColor, inputId }: FlagAtomInputProps) => {
  const [customValue, setCustomValue] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  const handleAdd = () => {
    const flagValue = selectedFlag || customValue.trim();
    if (!flagValue) return;
    onAddAtom({ kind: 'flag', value: flagValue });
  };

  return (
    <ModalShell>
      <ModalShell.Body>
        <div
          className={styles.atomModalContent}
          style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
        >
          <h3 className={styles.title}>Добавить флаг</h3>

          {/* Hidden focusable input for label→input pattern */}
          <input id={inputId} className={styles.hiddenFocus} tabIndex={-1} readOnly />

          {/* Preset flags first — main path, large touch targets */}
          <div className={styles.tagSuggestionsTop}>
            {PRESET_FLAGS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`${styles.quickChip} ${selectedFlag === value ? styles.active : ''}`}
                onClick={() => {
                  setSelectedFlag(value);
                  setCustomValue('');
                  setShowCustom(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom input — toggled by "Свой" button */}
          {!showCustom ? (
            <button
              type="button"
              className={styles.showCustomBtn}
              onClick={() => { setShowCustom(true); setSelectedFlag(null); }}
            >
              Свой флаг...
            </button>
          ) : (
            <div>
              <label>Свой флаг</label>
              <input
                type="text"
                autoFocus
                placeholder="например: 'требует лечения'"
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  setSelectedFlag(null);
                }}
              />
            </div>
          )}

          <AtomModalFooter
            onCancel={onClose}
            onAdd={handleAdd}
            addDisabled={!selectedFlag && !customValue.trim()}
            accentColor={accentColor}
          />
        </div>
      </ModalShell.Body>
    </ModalShell>
  );
};

FlagAtomInput.displayName = 'FlagAtomInput';

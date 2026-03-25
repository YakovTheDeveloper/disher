/**
 * RelationAtomInput - Fullscreen input for relation atoms
 *
 * Preset chips first — tap to auto-fill and enable "Add".
 * Textarea for custom input shown on demand.
 */

import { useState } from 'react';
import { RelationAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { AtomModalFooter } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface RelationAtomInputProps {
  onAddAtom: (atom: RelationAtom) => void;
  onClose: () => void;
  accentColor?: string;
  inputId?: string;
}

const PRESET_RELATIONS = [
  'из-за стресса',
  'после тренировки',
  'связано с работой',
  'после еды',
  'из-за плохого сна',
  'на фоне болезни',
];

export const RelationAtomInput = ({ onAddAtom, onClose, accentColor, inputId }: RelationAtomInputProps) => {
  const [value, setValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAddAtom({ kind: 'relation', value: trimmed });
  };

  const handlePresetTap = (preset: string) => {
    setValue(preset);
    setShowCustom(false);
  };

  return (
    <ModalShell>
      <ModalShell.Body>
        <div
          className={styles.atomModalContent}
          style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
        >
          <h3 className={styles.title}>Добавить связь</h3>
          <p className={styles.description}>Выразите причину или связь с другим событием</p>

          {/* Hidden focusable input for label→input pattern */}
          <input id={inputId} className={styles.hiddenFocus} tabIndex={-1} readOnly />

          {/* Preset chips — tap to select, larger for thumb zone */}
          <div className={styles.tagSuggestionsTop}>
            {PRESET_RELATIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`${styles.quickChip} ${value === preset ? styles.active : ''}`}
                onClick={() => handlePresetTap(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Custom textarea — toggled by button */}
          {!showCustom ? (
            <button
              type="button"
              className={styles.showCustomBtn}
              onClick={() => { setShowCustom(true); setValue(''); }}
            >
              Свой вариант...
            </button>
          ) : (
            <div>
              <label>Связь</label>
              <textarea
                autoFocus
                placeholder="из-за стресса, после тренировки..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <AtomModalFooter onCancel={onClose} onAdd={handleAdd} addDisabled={!value.trim()} accentColor={accentColor} />
        </div>
      </ModalShell.Body>
    </ModalShell>
  );
};

RelationAtomInput.displayName = 'RelationAtomInput';

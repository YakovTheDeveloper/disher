/**
 * ScaleAtomInput - Fullscreen input for scale atoms (1-10 ratings)
 *
 * The focused element is a number input displaying the current score.
 * User taps score buttons (1-10) or types directly.
 */

import { useState } from 'react';
import { ScaleAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { AtomModalFooter, PresetChips } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface ScaleAtomInputProps {
  onAddAtom: (atom: ScaleAtom) => void;
  onClose: () => void;
  accentColor?: string;
  inputId?: string;
}

const PRESET_LABELS = ['боль', 'настроение', 'энергия', 'стресс', 'тревога', 'нагрузка'];
const SCALE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const ScaleAtomInput = ({ onAddAtom, onClose, accentColor, inputId }: ScaleAtomInputProps) => {
  const [value, setValue] = useState(5);
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    onAddAtom({
      kind: 'scale',
      value,
      label: label || undefined,
    });
  };

  const handleValueInput = (v: string) => {
    const n = Number(v);
    if (n >= 1 && n <= 10) setValue(n);
  };

  return (
    <ModalShell>
      <ModalShell.Body>
        <div
          className={styles.atomModalContent}
          style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
        >
          <h3 className={styles.title}>Оценка</h3>

          {/* Focusable input at top — displays and accepts score value */}
          <input
            id={inputId}
            className={styles.scaleValueInput}
            type="number"
            min={1}
            max={10}
            value={value}
            onChange={(e) => handleValueInput(e.target.value)}
          />

          {/* Score buttons 1-10 */}
          <div className={styles.scaleButtons}>
            {SCALE_VALUES.map((v) => (
              <button
                key={v}
                type="button"
                className={`${styles.scaleButton} ${v === value ? styles.active : ''}`}
                onClick={() => setValue(v)}
              >
                {v}
              </button>
            ))}
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

          <AtomModalFooter onCancel={onClose} onAdd={handleAdd} accentColor={accentColor} />
        </div>
      </ModalShell.Body>
    </ModalShell>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';

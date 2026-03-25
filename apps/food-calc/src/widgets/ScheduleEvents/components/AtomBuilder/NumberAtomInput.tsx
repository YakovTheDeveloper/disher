/**
 * NumberAtomInput - Fullscreen input for number atoms
 *
 * Large centered value with [-]/[+] quick-increment buttons for one-handed use.
 */

import { useState, useCallback } from 'react';
import { NumberAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { AtomModalFooter, PresetChips } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface NumberAtomInputProps {
  onAddAtom: (atom: NumberAtom) => void;
  onClose: () => void;
  accentColor?: string;
  inputId?: string;
}

const PRESET_UNITS = ['км', 'м', 'бпм', '°C', 'мг', 'шаги', 'ккал', 'г'];

export const NumberAtomInput = ({ onAddAtom, onClose, accentColor, inputId }: NumberAtomInputProps) => {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [label, setLabel] = useState('');

  const numValue = Number(value) || 0;

  const handleAdd = () => {
    if (!value || isNaN(Number(value))) return;
    onAddAtom({
      kind: 'number',
      value: Number(value),
      unit: unit || undefined,
      label: label || undefined,
    });
  };

  const handleIncrement = useCallback((delta: number) => {
    setValue((prev) => {
      const current = Number(prev) || 0;
      const next = Math.max(0, current + delta);
      return String(next);
    });
  }, []);

  return (
    <ModalShell>
      <ModalShell.Body>
        <div
          className={styles.atomModalContent}
          style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
        >
          <h3 className={styles.title}>Добавить число</h3>

          {/* Large centered value with +/- buttons */}
          <div className={styles.numberStepper}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleIncrement(-1)}
              disabled={numValue <= 0}
            >
              −
            </button>
            <input
              id={inputId}
              className={styles.stepperInput}
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleIncrement(1)}
            >
              +
            </button>
          </div>

          {value && (
            <output className={styles.numberOutput}>
              {value}
              {unit && <span className={styles.numberOutputUnit}> {unit}</span>}
            </output>
          )}

          <div>
            <label>Единица</label>
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

          <AtomModalFooter onCancel={onClose} onAdd={handleAdd} addDisabled={!value} accentColor={accentColor} />
        </div>
      </ModalShell.Body>
    </ModalShell>
  );
};

NumberAtomInput.displayName = 'NumberAtomInput';

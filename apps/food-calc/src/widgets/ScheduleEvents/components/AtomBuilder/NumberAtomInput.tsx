/**
 * NumberAtomInput - Fullscreen input for number atoms
 */

import { useState } from 'react';
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

  const handleAdd = () => {
    if (!value || isNaN(Number(value))) return;
    onAddAtom({
      kind: 'number',
      value: Number(value),
      unit: unit || undefined,
      label: label || undefined,
    });
  };

  return (
    <ModalShell>
      <ModalShell.Body>
        <div
          className={styles.atomModalContent}
          style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
        >
          <h3 className={styles.title}>Добавить число</h3>

          <div>
            <label>Значение</label>
            <input
              id={inputId}
              type="number"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {value && (
              <output>
                {value}
                {unit && <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.6 }}> {unit}</span>}
              </output>
            )}
          </div>

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

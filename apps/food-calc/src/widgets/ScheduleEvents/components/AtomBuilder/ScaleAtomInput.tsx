/**
 * ScaleAtomInput — 1–10 scale rating with label and preset chips.
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useState } from 'react';
import { ScaleAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import styles from './shared/AtomInputShared.module.css';

export interface ScaleAtomInputProps {
  onAddAtom: (atom: ScaleAtom) => void;
  onClose: () => void;
  accentColor?: string;
}

const PRESET_LABELS = ['Боль', 'Настроение', 'Энергия', 'Стресс', 'Тревога', 'Нагрузка'];

export const ScaleAtomInput = ({ onAddAtom, onClose, accentColor }: ScaleAtomInputProps) => {
  const [value, setValue] = useState<number | ''>(5);
  const [label, setLabel] = useState('');
  const [isReady, setIsReady] = useState(false);

  const handleAdd = () => {
    onAddAtom({ kind: 'scale', value: value || 5, label: label || undefined });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setValue('');
      return;
    }
    const n = Math.min(10, Math.max(1, Number(raw)));
    setValue(n);
  };

  return (
    <div
      className={styles.atomPanel}
      style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
    >
      <div className={styles.panelBody}>
        <div className={styles.bigInputGroup}>
          <input
            className={styles.bigNumberInput}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={handleValueChange}
            onFocus={(e) => {
              setIsReady(true);
              e.target.select();
            }}
            autoFocus
          />
          <div className={styles.bigInputUnderline} />
        </div>

        {/* Label field */}
        <div className={styles.fieldGroup}>
          <input
            className={styles.labelInput}
            type="text"
            placeholder="явление"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onFocus={() => setIsReady(true)}
          />
          <div className={styles.fieldUnderline} />
        </div>

        {/* Preset chips */}
        <div className={styles.chips}>
          {PRESET_LABELS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`${styles.chip} ${label.toLowerCase() === preset.toLowerCase() ? styles.chipActive : ''}`}
              onClick={() => setLabel(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {isReady && (
        <ModalShell.ActionButtons
          left={<ModalPrevButton theme="events" onClick={onClose} />}
          right={<ModalNextButton onClick={handleAdd} variant="finish" theme="events" />}
        />
      )}
    </div>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';

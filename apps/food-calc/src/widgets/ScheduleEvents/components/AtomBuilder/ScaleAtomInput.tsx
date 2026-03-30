/**
 * ScaleAtomInput — 1–10 scale rating with label and preset chips.
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useState } from 'react';
import { ScaleAtom } from '@/entities/schedule-event';
import styles from './shared/AtomInputShared.module.css';

export interface ScaleAtomInputProps {
  onAddAtom: (atom: ScaleAtom) => void;
  onClose: () => void;
  accentColor?: string;
}

const PRESET_LABELS = ['Боль', 'Настроение', 'Энергия', 'Стресс', 'Тревога', 'Нагрузка'];

const BackArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
    <path
      d="M19 12H5M11 18l-6-6 6-6"
      stroke="#111"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
    <circle cx="12" cy="12" r="10" stroke="#111" strokeWidth="1" />
    <path
      d="M7.5 12l3 3 6-6"
      stroke="#111"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ScaleAtomInput = ({ onAddAtom, onClose, accentColor }: ScaleAtomInputProps) => {
  const [value, setValue] = useState<number | ''>(5);
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    onAddAtom({ kind: 'scale', value: value || 5, label: label || undefined });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setValue(''); return; }
    const n = Math.min(10, Math.max(1, Number(raw)));
    setValue(n);
  };

  return (
    <div
      className={styles.atomPanel}
      style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
    >
      <div className={styles.panelBody}>
        {/* ← [number input] → */}
        <div className={styles.inputRow}>
          <button type="button" className={styles.navBtn} onClick={onClose}>
            <BackArrow />
          </button>
          <div className={styles.bigInputGroup}>
            <input
              className={styles.bigNumberInput}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={handleValueChange}
              onFocus={(e) => e.target.select()}
              autoFocus
            />
            <div className={styles.bigInputUnderline} />
          </div>
          <button type="button" className={`${styles.navBtn} ${styles.doneBtn}`} onClick={handleAdd}>
            <DoneIcon />
          </button>
        </div>

        {/* Label field */}
        <div className={styles.fieldGroup}>
          <input
            className={styles.labelInput}
            type="text"
            placeholder="явление"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
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
    </div>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';

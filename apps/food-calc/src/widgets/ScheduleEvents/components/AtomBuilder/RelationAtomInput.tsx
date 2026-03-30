/**
 * RelationAtomInput — Text input for relation atoms with preset chips.
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useState } from 'react';
import { RelationAtom } from '@/entities/schedule-event';
import styles from './shared/AtomInputShared.module.css';

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

export const RelationAtomInput = ({ onAddAtom, onClose, accentColor }: RelationAtomInputProps) => {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAddAtom({ kind: 'relation', value: trimmed });
  };

  const addDisabled = !value.trim();

  return (
    <div
      className={styles.atomPanel}
      style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
    >
      <div className={styles.panelBody}>
        {/* ← [text input] → */}
        <div className={styles.inputRow}>
          <button type="button" className={styles.navBtn} onClick={onClose}>
            <BackArrow />
          </button>
          <div className={styles.bigInputGroup}>
            <input
              className={styles.bigTextInput}
              type="text"
              placeholder="причина или связь"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              autoFocus
            />
            <div className={styles.fieldUnderline} />
          </div>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.doneBtn} ${addDisabled ? styles.navBtnDisabled : ''}`}
            onClick={handleAdd}
          >
            <DoneIcon />
          </button>
        </div>

        <div className={styles.chips}>
          {PRESET_RELATIONS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`${styles.chip} ${value === preset ? styles.chipActive : ''}`}
              onClick={() => setValue(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

RelationAtomInput.displayName = 'RelationAtomInput';

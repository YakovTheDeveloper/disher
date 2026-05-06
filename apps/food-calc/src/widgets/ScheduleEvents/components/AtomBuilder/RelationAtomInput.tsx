/**
 * RelationAtomInput — Text input for relation atoms with preset chips.
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useState } from 'react';
import { RelationAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
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

export const RelationAtomInput = ({ onAddAtom, accentColor }: RelationAtomInputProps) => {
  const [value, setValue] = useState('');
  const [isReady, setIsReady] = useState(false);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAddAtom({ kind: 'relation', value: trimmed });
  };

  return (
    <div
      className={styles.atomPanel}
      style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
    >
      <div className={styles.panelBody}>
        <div className={styles.bigInputGroup}>
          <input
            className={styles.bigTextInput}
            type="text"
            placeholder="причина или связь"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            onFocus={() => setIsReady(true)}
            autoFocus
          />
          <div className={styles.fieldUnderline} />
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

      {isReady && (
        <ModalShell.ActionButtons
          right={<ModalNextButton onClick={handleAdd} variant="finish" theme="events" />}
        />
      )}
    </div>
  );
};

RelationAtomInput.displayName = 'RelationAtomInput';

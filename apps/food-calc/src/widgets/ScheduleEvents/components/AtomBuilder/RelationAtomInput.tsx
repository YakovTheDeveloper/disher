/**
 * RelationAtomInput - Fullscreen input for relation atoms
 */

import { useState } from 'react';
import { RelationAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { AtomModalFooter, PresetChips } from './shared';
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

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAddAtom({ kind: 'relation', value: trimmed });
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

          <div>
            <label>Связь</label>
            <textarea
              id={inputId}
              placeholder="из-за стресса, после тренировки, связано с работой..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label>Примеры</label>
            <PresetChips presets={PRESET_RELATIONS} value={value} onChange={setValue} />
          </div>

          <AtomModalFooter onCancel={onClose} onAdd={handleAdd} addDisabled={!value.trim()} accentColor={accentColor} />
        </div>
      </ModalShell.Body>
    </ModalShell>
  );
};

RelationAtomInput.displayName = 'RelationAtomInput';

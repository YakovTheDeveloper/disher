/**
 * RelationAtomInput — Text input for relation atoms with preset chips.
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useState, useEffect, useRef } from 'react';
import { RelationAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { ModalHeader } from '@/shared/ui/ModalHeader';
import { Chip } from '@/shared/ui/atoms/Chip';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
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

export const RelationAtomInput = ({ onAddAtom, onClose, accentColor }: RelationAtomInputProps) => {
  const [value, setValue] = useState('');
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus without scrolling — see ScaleAtomInput for the rationale.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

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
      <ModalHeader title="Связь" onBack={onClose} />
      <div className={styles.panelBody}>
        <AutoGrowSearch
          ref={inputRef}
          singleLine
          placeholder="причина или связь"
          value={value}
          onChange={setValue}
          onSubmit={handleAdd}
          onFocus={() => setIsReady(true)}
        />

        <div className={styles.chips}>
          {PRESET_RELATIONS.map((preset) => (
            <Chip
              key={preset}
              active={value === preset}
              // Keep the focused input from blurring on tap — otherwise the
              // keyboard collapses and the viewport reflows mid-tap. See
              // ScaleAtomInput for the same guard.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setValue(preset)}
            >
              {preset}
            </Chip>
          ))}
        </div>
      </div>

      {isReady && (
        <ModalShell.ActionButtons
          right={
            <ModalNextButton
              onClick={handleAdd}
              variant="finish"
              theme="events"
              label="Добавить"
            />
          }
        />
      )}
    </div>
  );
};

RelationAtomInput.displayName = 'RelationAtomInput';

/**
 * TagAtomInput — Text input for tag atoms with suggestion chips.
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useState, useMemo } from 'react';
import { TagAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import styles from './shared/AtomInputShared.module.css';

export interface TagAtomInputProps {
  onAddAtom: (atom: TagAtom) => void;
  onClose: () => void;
  accentColor?: string;
  popularTags?: string[];
  recentTags?: string[];
}

export const TagAtomInput = ({
  onAddAtom,
  accentColor,
  popularTags = [],
  recentTags = [],
}: TagAtomInputProps) => {
  const [input, setInput] = useState('');
  const [isReady, setIsReady] = useState(false);

  const suggestions = useMemo(() => {
    const all = Array.from(new Set([...popularTags, ...recentTags]));
    if (!input.trim()) return all.slice(0, 12);
    const lower = input.toLowerCase();
    return all.filter((t) => t.toLowerCase().includes(lower)).slice(0, 12);
  }, [input, popularTags, recentTags]);

  const handleAdd = (tagValue: string = input) => {
    const trimmed = tagValue.trim();
    if (!trimmed) return;
    onAddAtom({ kind: 'tag', value: trimmed });
    setInput('');
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
            placeholder="тег"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            onFocus={() => setIsReady(true)}
            autoFocus
          />
          <div className={styles.fieldUnderline} />
        </div>

        {suggestions.length > 0 && (
          <div className={styles.chips}>
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.chip} ${input === tag ? styles.chipActive : ''}`}
                onClick={() => handleAdd(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {isReady && (
        <ModalShell.ActionButtons
          right={<ModalNextButton onClick={() => handleAdd()} variant="finish" theme="events" />}
        />
      )}
    </div>
  );
};

TagAtomInput.displayName = 'TagAtomInput';

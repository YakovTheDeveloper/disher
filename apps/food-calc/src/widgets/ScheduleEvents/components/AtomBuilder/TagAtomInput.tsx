/**
 * TagAtomInput — Text input for tag atoms with suggestion chips.
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useState, useMemo } from 'react';
import { TagAtom } from '@/entities/schedule-event';
import styles from './shared/AtomInputShared.module.css';

export interface TagAtomInputProps {
  onAddAtom: (atom: TagAtom) => void;
  onClose: () => void;
  accentColor?: string;
  popularTags?: string[];
  recentTags?: string[];
}

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

export const TagAtomInput = ({ onAddAtom, onClose, accentColor, popularTags = [], recentTags = [] }: TagAtomInputProps) => {
  const [input, setInput] = useState('');

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

  const addDisabled = !input.trim();

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
              placeholder="тег"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              autoFocus
            />
            <div className={styles.fieldUnderline} />
          </div>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.doneBtn} ${addDisabled ? styles.navBtnDisabled : ''}`}
            onClick={() => handleAdd()}
          >
            <DoneIcon />
          </button>
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
    </div>
  );
};

TagAtomInput.displayName = 'TagAtomInput';

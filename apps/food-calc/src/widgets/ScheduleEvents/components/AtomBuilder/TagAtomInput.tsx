/**
 * TagAtomInput - Fullscreen input for tag atoms with inline suggestions
 *
 * Suggestions in thumb zone — tap a chip to instantly add the tag.
 * Text input for custom tags, Enter to add.
 */

import { useState, useMemo } from 'react';
import { TagAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { AtomModalFooter } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface TagAtomInputProps {
  onAddAtom: (atom: TagAtom) => void;
  onClose: () => void;
  accentColor?: string;
  inputId?: string;
  popularTags?: string[];
  recentTags?: string[];
}

export const TagAtomInput = ({ onAddAtom, onClose, accentColor, inputId, popularTags = [], recentTags = [] }: TagAtomInputProps) => {
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

  return (
    <ModalShell>
      <ModalShell.Body>
        <div
          className={styles.atomModalContent}
          style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
        >
          <h3 className={styles.title}>Добавить тег</h3>

          {/* Suggestions first — in thumb zone, instant add on tap */}
          {suggestions.length > 0 && (
            <div className={styles.tagSuggestionsTop}>
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.quickChip} ${input === tag ? styles.active : ''}`}
                  onClick={() => handleAdd(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          <div>
            <label>Свой тег</label>
            <input
              id={inputId}
              type="text"
              placeholder="бег, работа, семья, усталость..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
          </div>

          <AtomModalFooter onCancel={onClose} onAdd={() => handleAdd()} addDisabled={!input.trim()} accentColor={accentColor} />
        </div>
      </ModalShell.Body>
    </ModalShell>
  );
};

TagAtomInput.displayName = 'TagAtomInput';

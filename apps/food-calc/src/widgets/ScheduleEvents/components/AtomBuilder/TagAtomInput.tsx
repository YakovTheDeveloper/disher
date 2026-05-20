/**
 * TagAtomInput — Text input for tag atoms with suggestion chips.
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { TagAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { ModalHeader } from '@/shared/ui/ModalHeader';
import { Chip } from '@/shared/ui/atoms/Chip';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import styles from './shared/AtomInputShared.module.css';

export interface TagAtomInputProps {
  onAddAtom: (atom: TagAtom) => void;
  onClose: () => void;
  popularTags?: string[];
  recentTags?: string[];
}

export const TagAtomInput = ({
  onAddAtom,
  onClose,
  popularTags = [],
  recentTags = [],
}: TagAtomInputProps) => {
  const [input, setInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus without scrolling — see ScaleAtomInput for the rationale.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

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
    <div className={styles.atomPanel}>
      <ModalHeader title="Тег" onBack={onClose} size="compact" />
      <div className={styles.panelBody}>
        <AutoGrowSearch
          ref={inputRef}
          singleLine
          placeholder="тег"
          value={input}
          onChange={setInput}
          onSubmit={() => handleAdd()}
          onFocus={() => setIsReady(true)}
        />

        {suggestions.length > 0 && (
          <div className={styles.chips}>
            {suggestions.map((tag) => (
              <Chip
                key={tag}
                // Keep the focused input from blurring on tap — otherwise the
                // keyboard collapses and the viewport reflows mid-tap. See
                // ScaleAtomInput for the same guard.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAdd(tag)}
              >
                #{tag}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {isReady && (
        <ModalShell.ActionButtons
          right={
            <ModalNextButton onClick={() => handleAdd()} variant="finish" label="Добавить" />
          }
        />
      )}
    </div>
  );
};

TagAtomInput.displayName = 'TagAtomInput';

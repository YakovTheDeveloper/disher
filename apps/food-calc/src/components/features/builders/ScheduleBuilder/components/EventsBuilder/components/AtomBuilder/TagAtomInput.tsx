/**
 * TagAtomInput - Input component for tag atoms with autocomplete
 */

import { useState, useMemo } from 'react';
import { useStore } from '@/store/store';
import { TagAtom } from '@/domain/schedule/scheduleEvent/atom.types';
import { AtomInputLayout, AtomActionButtons } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface TagAtomInputProps {
  onAddAtom: (atom: TagAtom) => void;
  onClose: () => void;
}

/**
 * TagAtomInput Component
 *
 * Allows user to add a tag atom with autocomplete suggestions from history
 */
export const TagAtomInput = ({ onAddAtom, onClose }: TagAtomInputProps) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const store = useStore();

  const suggestions = useMemo(() => {
    if (!input.trim()) {
      return store.eventScheduleStore.getPopularTags();
    }

    const lowerInput = input.toLowerCase();
    const allTags = [
      ...store.eventScheduleStore.getPopularTags(),
      ...store.eventScheduleStore.getRecentTags(),
    ];

    // Remove duplicates and filter by input
    const unique = Array.from(new Set(allTags));
    return unique.filter((tag) => tag.toLowerCase().includes(lowerInput)).slice(0, 10);
  }, [input, store.eventScheduleStore]);

  const handleAdd = (tagValue: string = input) => {
    const trimmed = tagValue.trim();
    if (!trimmed) {
      alert('Пожалуйста, введите тег');
      return;
    }

    onAddAtom({
      kind: 'tag',
      value: trimmed,
    });
    setInput('');
  };

  return (
    <AtomInputLayout title="Добавить тег">
      <div>
        <label>Тег</label>
        <div className={styles.autocompleteContainer}>
          <input
            type="text"
            placeholder="бег, работа, семья, усталость..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestionsList}>
              {suggestions.map((tag: string) => (
                <button
                  key={tag}
                  type="button"
                  className={styles.suggestionItem}
                  onClick={() => {
                    setInput(tag);
                    setShowSuggestions(false);
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AtomActionButtons onCancel={onClose} onAdd={() => handleAdd()} addDisabled={!input.trim()} />
    </AtomInputLayout>
  );
};

TagAtomInput.displayName = 'TagAtomInput';

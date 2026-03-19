/**
 * AtomBuilder - Main component for composing events from atoms
 *
 * Works with the Zustand draft store during editing.
 * Atoms are persisted to Triplit when the parent commits (create/update).
 */

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Atom } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { AtomList } from './AtomList';
import { ScaleAtomInput } from './ScaleAtomInput';
import { TimeAtomInput } from './TimeAtomInput';
import { NumberAtomInput } from './NumberAtomInput';
import { TagAtomInput } from './TagAtomInput';
import { RelationAtomInput } from './RelationAtomInput';
import { FlagAtomInput } from './FlagAtomInput';
import { BodyAtomInput } from './BodyAtomInput';
import styles from './AtomBuilder.module.css';

export interface AtomBuilderProps {
  className?: string;
}

type AtomModalKind = 'scale' | 'time' | 'number' | 'tag' | 'relation' | 'flag' | 'body' | null;

export const AtomBuilder = ({ className = '' }: AtomBuilderProps) => {
    const atoms = useEventDraftStore((s) => s.draft.atoms);
    const addAtom = useEventDraftStore((s) => s.addAtom);
    const removeAtom = useEventDraftStore((s) => s.removeAtom);
    const [openModal, setOpenModal] = useState<AtomModalKind>(null);

    const handleAddAtom = (atom: Atom) => {
      addAtom(atom);
      setOpenModal(null);
    };

    const handleRemoveAtom = (index: number) => {
      removeAtom(index);
    };

    return (
      <div className={`${styles.container} ${className}`}>
        <AtomList atoms={atoms} onRemove={handleRemoveAtom} />

        <div className={styles.atomButtons}>
          <button onClick={() => setOpenModal('scale')} disabled={openModal !== null} type="button">
            + Оценка (1-10)
          </button>
          <button onClick={() => setOpenModal('time')} disabled={openModal !== null} type="button">
            + Время
          </button>
          <button
            onClick={() => setOpenModal('number')}
            disabled={openModal !== null}
            type="button"
          >
            + Число
          </button>
          <button onClick={() => setOpenModal('tag')} disabled={openModal !== null} type="button">
            + Тег
          </button>
          <button
            onClick={() => setOpenModal('relation')}
            disabled={openModal !== null}
            type="button"
          >
            + Связь
          </button>
          <button onClick={() => setOpenModal('flag')} disabled={openModal !== null} type="button">
            + Флаг
          </button>
          <button onClick={() => setOpenModal('body')} disabled={openModal !== null} type="button">
            + Тело
          </button>
        </div>

        <div className={styles.inputContainer}>
          <AnimatePresence mode="wait">
            {openModal === 'scale' && (
              <ScaleAtomInput
                key="scale"
                onAddAtom={handleAddAtom}
                onClose={() => setOpenModal(null)}
              />
            )}
            {openModal === 'time' && (
              <TimeAtomInput
                key="time"
                onAddAtom={handleAddAtom}
                onClose={() => setOpenModal(null)}
              />
            )}
            {openModal === 'number' && (
              <NumberAtomInput
                key="number"
                onAddAtom={handleAddAtom}
                onClose={() => setOpenModal(null)}
              />
            )}
            {openModal === 'tag' && (
              <TagAtomInput
                key="tag"
                onAddAtom={handleAddAtom}
                onClose={() => setOpenModal(null)}
              />
            )}
            {openModal === 'relation' && (
              <RelationAtomInput
                key="relation"
                onAddAtom={handleAddAtom}
                onClose={() => setOpenModal(null)}
              />
            )}
            {openModal === 'flag' && (
              <FlagAtomInput
                key="flag"
                onAddAtom={handleAddAtom}
                onClose={() => setOpenModal(null)}
              />
            )}
            {openModal === 'body' && (
              <BodyAtomInput
                key="body"
                onAddAtom={handleAddAtom}
                onClose={() => setOpenModal(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
};

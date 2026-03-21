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

    const ATOM_BUTTONS: { kind: AtomModalKind; label: string }[] = [
      { kind: 'scale', label: 'Оценка' },
      { kind: 'time', label: 'Время' },
      { kind: 'number', label: 'Число' },
      { kind: 'tag', label: 'Тег' },
      { kind: 'relation', label: 'Связь' },
      { kind: 'flag', label: 'Флаг' },
      { kind: 'body', label: 'Тело' },
    ];

    const INPUT_MAP: Record<string, React.ReactNode> = {
      scale: <ScaleAtomInput key="scale" onAddAtom={handleAddAtom} onClose={() => setOpenModal(null)} />,
      time: <TimeAtomInput key="time" onAddAtom={handleAddAtom} onClose={() => setOpenModal(null)} />,
      number: <NumberAtomInput key="number" onAddAtom={handleAddAtom} onClose={() => setOpenModal(null)} />,
      tag: <TagAtomInput key="tag" onAddAtom={handleAddAtom} onClose={() => setOpenModal(null)} />,
      relation: <RelationAtomInput key="relation" onAddAtom={handleAddAtom} onClose={() => setOpenModal(null)} />,
      flag: <FlagAtomInput key="flag" onAddAtom={handleAddAtom} onClose={() => setOpenModal(null)} />,
      body: <BodyAtomInput key="body" onAddAtom={handleAddAtom} onClose={() => setOpenModal(null)} />,
    };

    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.inputContainer}>
          <AnimatePresence mode="wait">
            {openModal && INPUT_MAP[openModal]}
          </AnimatePresence>
        </div>

        <AtomList atoms={atoms} onRemove={handleRemoveAtom} />

        <div className={styles.atomButtons}>
          {ATOM_BUTTONS.map(({ kind, label }) => (
            <button
              key={kind}
              onClick={() => setOpenModal(kind)}
              disabled={openModal !== null}
              type="button"
              data-active={openModal === kind || undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
};

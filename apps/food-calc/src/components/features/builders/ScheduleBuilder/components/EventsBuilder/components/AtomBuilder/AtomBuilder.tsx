/**
 * AtomBuilder - Main component for composing events from atoms
 *
 * Replaces the old type-based event system with a flexible atomic approach.
 */

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Instance } from 'mobx-state-tree';
import { AnimatePresence } from 'framer-motion';
import { Atom } from '@/domain/schedule/scheduleEvent/atom.types';
import { ScheduleEvent } from '@/domain/schedule/scheduleEvent/ScheduleEvent.model';
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
  event: Instance<typeof ScheduleEvent>;
  onEventChange?: (event: Instance<typeof ScheduleEvent>) => void;
  className?: string;
}

type AtomModalKind = 'scale' | 'time' | 'number' | 'tag' | 'relation' | 'flag' | 'body' | null;

export const AtomBuilder = observer(
  ({ event, onEventChange, className = '' }: AtomBuilderProps) => {
    const [openModal, setOpenModal] = useState<AtomModalKind>(null);

    const handleAddAtom = (atom: Atom) => {
      event.addAtom(atom);
      setOpenModal(null);
      onEventChange?.(event);
    };

    const handleRemoveAtom = (index: number) => {
      event.removeAtom(index);
      onEventChange?.(event);
    };

    return (
      <div className={`${styles.container} ${className}`}>
        <AtomList atoms={event.atoms as unknown as Atom[]} onRemove={handleRemoveAtom} />

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
  }
);

AtomBuilder.displayName = 'AtomBuilder';

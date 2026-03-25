/**
 * AtomBuilder - Main component for composing events from atoms
 *
 * Layout: AtomList (top) → fullscreen modals via ModalByLabel → type buttons (bottom, near thumb)
 * Each button is a <label htmlFor={inputId}> that focuses the corresponding input inside the modal.
 */

import { useCallback, useState } from 'react';
import type { Atom } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
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
  id?: string;
  className?: string;
}

type AtomModalKind = 'scale' | 'time' | 'number' | 'tag' | 'relation' | 'flag' | 'body';

/**
 * Input IDs used for label→input focus delegation across AtomBuilder modals.
 */
export const ATOM_INPUT_IDS: Record<AtomModalKind, string> = {
  scale: 'atom-input-scale',
  time: 'atom-input-time',
  number: 'atom-input-number',
  tag: 'atom-input-tag',
  relation: 'atom-input-relation',
  flag: 'atom-input-flag',
  body: 'atom-input-body',
};

const INPUT_ID_TO_KIND: Record<string, AtomModalKind> = Object.fromEntries(
  Object.entries(ATOM_INPUT_IDS).map(([kind, id]) => [id, kind as AtomModalKind])
);

const ATOM_BUTTONS: { kind: AtomModalKind; label: string }[] = [
  { kind: 'scale', label: 'Оценка' },
  { kind: 'time', label: 'Время' },
  { kind: 'number', label: 'Число' },
  { kind: 'tag', label: 'Тег' },
  { kind: 'relation', label: 'Связь' },
  { kind: 'flag', label: 'Флаг' },
  { kind: 'body', label: 'Тело' },
];

const ATOM_ACCENT: Record<AtomModalKind, string> = {
  scale:    'var(--event-scale-accent)',
  time:     'var(--event-time-accent)',
  number:   'var(--event-number-accent)',
  tag:      'var(--event-tag-accent)',
  relation: 'var(--event-relation-accent)',
  flag:     'var(--event-flag-accent)',
  body:     'var(--event-body-accent)',
};

export const AtomBuilder = ({ id, className = '' }: AtomBuilderProps) => {
    const atoms = useEventDraftStore((s) => s.draft.atoms);
    const addAtom = useEventDraftStore((s) => s.addAtom);
    const removeAtom = useEventDraftStore((s) => s.removeAtom);
    const [openModal, setOpenModal] = useState<AtomModalKind | null>(null);

    const handleAddAtom = (atom: Atom) => {
      addAtom(atom);
      setOpenModal(null);
    };

    const handleClose = () => setOpenModal(null);

    const handleFocusCapture = useCallback((e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      const kind = INPUT_ID_TO_KIND[target.id];
      if (!kind) return;
      setOpenModal(kind);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        });
      });
    }, []);

    return (
      <div id={id} tabIndex={id ? -1 : undefined} className={`${styles.container} ${className}`} onFocusCapture={handleFocusCapture}>
        <AtomList atoms={atoms} onRemove={removeAtom} />

        {/* Fullscreen modals for each atom type */}
        <ModalByLabel
          position="absolute"
          isExpanded={openModal === 'scale'}
          content={
            <ScaleAtomInput
              accentColor={ATOM_ACCENT.scale}
              onAddAtom={handleAddAtom}
              onClose={handleClose}
              inputId={ATOM_INPUT_IDS.scale}
            />
          }
        />
        <ModalByLabel
          position="absolute"
          isExpanded={openModal === 'time'}
          content={
            <TimeAtomInput
              accentColor={ATOM_ACCENT.time}
              onAddAtom={handleAddAtom}
              onClose={handleClose}
              inputId={ATOM_INPUT_IDS.time}
            />
          }
        />
        <ModalByLabel
          position="absolute"
          isExpanded={openModal === 'number'}
          content={
            <NumberAtomInput
              accentColor={ATOM_ACCENT.number}
              onAddAtom={handleAddAtom}
              onClose={handleClose}
              inputId={ATOM_INPUT_IDS.number}
            />
          }
        />
        <ModalByLabel
          position="absolute"
          isExpanded={openModal === 'tag'}
          content={
            <TagAtomInput
              accentColor={ATOM_ACCENT.tag}
              onAddAtom={handleAddAtom}
              onClose={handleClose}
              inputId={ATOM_INPUT_IDS.tag}
            />
          }
        />
        <ModalByLabel
          position="absolute"
          isExpanded={openModal === 'relation'}
          content={
            <RelationAtomInput
              accentColor={ATOM_ACCENT.relation}
              onAddAtom={handleAddAtom}
              onClose={handleClose}
              inputId={ATOM_INPUT_IDS.relation}
            />
          }
        />
        <ModalByLabel
          position="absolute"
          isExpanded={openModal === 'flag'}
          content={
            <FlagAtomInput
              accentColor={ATOM_ACCENT.flag}
              onAddAtom={handleAddAtom}
              onClose={handleClose}
              inputId={ATOM_INPUT_IDS.flag}
            />
          }
        />
        <ModalByLabel
          position="absolute"
          isExpanded={openModal === 'body'}
          content={
            <BodyAtomInput
              accentColor={ATOM_ACCENT.body}
              onAddAtom={handleAddAtom}
              onClose={handleClose}
            />
          }
        />

        {/* Type buttons at bottom — labels focus input, body uses onClick (no input to focus) */}
        <div className={styles.atomButtons}>
          {ATOM_BUTTONS.map(({ kind, label }) =>
            kind === 'body' ? (
              <button
                key={kind}
                type="button"
                onClick={() => setOpenModal('body')}
                data-kind={kind}
                data-active={openModal === kind || undefined}
              >
                {label}
              </button>
            ) : (
              <label
                key={kind}
                htmlFor={ATOM_INPUT_IDS[kind]}
                data-kind={kind}
                data-active={openModal === kind || undefined}
              >
                {label}
              </label>
            )
          )}
        </div>
      </div>
    );
};

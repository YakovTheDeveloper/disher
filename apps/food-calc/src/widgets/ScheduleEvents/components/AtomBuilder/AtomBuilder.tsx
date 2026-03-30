/**
 * AtomBuilder — Compose events from atoms (scale, tag, relation).
 *
 * No nested ModalByLabel: atom inputs render inline, switching via openPanel state.
 * The parent ModalByLabel provides the fullscreen context.
 */

import { useState } from 'react';
import type { Atom } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { AtomList } from './AtomList';
import { ScaleAtomInput } from './ScaleAtomInput';
import { TagAtomInput } from './TagAtomInput';
import { RelationAtomInput } from './RelationAtomInput';
import styles from './AtomBuilder.module.css';

export interface AtomBuilderProps {
  id?: string;
  className?: string;
  onPanelChange?: (isOpen: boolean) => void;
}

type AtomPanel = 'scale' | 'tag' | 'relation';

const ATOM_BUTTONS: { kind: AtomPanel; label: string }[] = [
  { kind: 'scale', label: 'Оценка' },
  { kind: 'tag', label: 'Тег' },
  { kind: 'relation', label: 'Связь' },
];

const ATOM_ACCENT: Record<AtomPanel, string> = {
  scale: 'var(--event-scale-accent)',
  tag: 'var(--event-tag-accent)',
  relation: 'var(--event-relation-accent)',
};

export const AtomBuilder = ({ id, className = '', onPanelChange }: AtomBuilderProps) => {
  const atoms = useEventDraftStore((s) => s.draft.atoms);
  const addAtom = useEventDraftStore((s) => s.addAtom);
  const removeAtom = useEventDraftStore((s) => s.removeAtom);
  const [openPanel, setOpenPanel] = useState<AtomPanel | null>(null);

  const openAtomPanel = (panel: AtomPanel) => {
    setOpenPanel(panel);
    onPanelChange?.(true);
  };

  const handleAddAtom = (atom: Atom) => {
    addAtom(atom);
    setOpenPanel(null);
    onPanelChange?.(false);
  };

  const handleClose = () => {
    setOpenPanel(null);
    onPanelChange?.(false);
  };

  // If a panel is open, render it fullscreen-style (fills the parent ModalByLabel)
  if (openPanel) {
    const InputComponent = {
      scale: ScaleAtomInput,
      tag: TagAtomInput,
      relation: RelationAtomInput,
    }[openPanel];

    return (
      <div id={id} tabIndex={id ? -1 : undefined} className={`${styles.panelView} ${className}`}>
        <InputComponent
          accentColor={ATOM_ACCENT[openPanel]}
          onAddAtom={handleAddAtom}
          onClose={handleClose}
        />
      </div>
    );
  }

  const hasAtoms = atoms.length > 0;

  // Default: show atom list + type selector buttons
  return (
    <div id={id} tabIndex={id ? -1 : undefined} className={`${styles.container} ${className}`}>
      <AtomList atoms={atoms} onRemove={removeAtom} />

      <div className={`${styles.atomButtons} ${!hasAtoms ? styles.noAtoms : ''}`}>
        {ATOM_BUTTONS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            data-kind={kind}
            className={styles.atomBtn}
            onClick={() => openAtomPanel(kind)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

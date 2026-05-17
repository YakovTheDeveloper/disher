/**
 * AtomBuilder — Compose events from atoms (scale, tag, relation).
 *
 * No nested ModalByLabel: atom inputs render inline, switching via openPanel state.
 * The parent ModalByLabel provides the fullscreen context.
 */

import { useState } from 'react';
import type { Atom } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { NavTile } from '@/shared/ui/NavTile';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
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

const ATOM_BUTTONS: { kind: AtomPanel; label: string; image: string }[] = [
  { kind: 'scale', label: 'Оценка', image: '/art/scale-2.png' },
  { kind: 'tag', label: 'Тег', image: '/art/tag-2.png' },
  { kind: 'relation', label: 'Связь', image: '/art/link-2.png' },
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

  // Default: show atom list + type selector buttons
  return (
    <div id={id} tabIndex={id ? -1 : undefined} className={`${styles.container} ${className}`}>
      <AtomList atoms={atoms} onRemove={removeAtom} />

      <div className={styles.tileSection}>
        <Heading size="modal" as="h2" className={styles.tileHeading}>
          Особенности
        </Heading>

        <div className={styles.atomButtons}>
          {ATOM_BUTTONS.map(({ kind, label, image }) => (
            <NavTile
              key={kind}
              label={label}
              image={image}
              active
              solidLabel
              onClick={() => openAtomPanel(kind)}
            />
          ))}
        </div>

        <Text variant="hint" as="p" className={styles.tileHint}>
          Если особо нечего уточнять - пропускаем.
        </Text>
      </div>
    </div>
  );
};

/**
 * AtomBuilder — Compose events from atoms (scale, tag, relation).
 *
 * No nested ModalByLabel: atom inputs render inline, switching via openPanel state.
 * The parent ModalByLabel provides the fullscreen context.
 */

import { useState, type CSSProperties } from 'react';
import type { Atom } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { NavTile } from '@/shared/ui/NavTile';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
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

// imgOffset — сдвиг картинки-призрака в ПРОЦЕНТАХ (translate относительно
// размера .tileImg = 100% плитки), чтобы композиция держалась на любом
// размере экрана. Подобрано на компе при ширине плитки 101px и переведено
// из px в %: scale −23/4 → −22.8/4, tag 14/6 → 13.9/5.9, relation 29/3 → 28.7/3.
const ATOM_BUTTONS: {
  kind: AtomPanel;
  label: string;
  image: string;
  imgOffset: { x: string; y: string };
}[] = [
  { kind: 'scale', label: 'Оценка', image: '/art/scale-2.png', imgOffset: { x: '-22.8%', y: '4%' } },
  { kind: 'tag', label: 'Тег', image: '/art/tag-2.png', imgOffset: { x: '13.9%', y: '5.9%' } },
  { kind: 'relation', label: 'Связь', image: '/art/link-2.png', imgOffset: { x: '28.7%', y: '3%' } },
];

// Solid accent — caret / underline / borders / icon colour.
const ATOM_ACCENT: Record<AtomPanel, string> = {
  scale: 'var(--event-scale-accent)',
  tag: 'var(--event-tag-accent)',
  relation: 'var(--event-relation-accent)',
};

// Accent palettes for scale/tag/relation. Each keeps the three kinds as
// close-but-distinct shades — never the old neon. Flip live via the
// DesignVariantsBar; CSS lives in AtomBuilder.module.css. First = default.
const ATOM_ACCENT_VARIANTS = [
  'sage',
  'meadow',
  'grape',
  'lilac',
  'ocean',
  'berry',
  'marigold',
  'lemon',
  'bloom',
  'sky',
  'mint',
  'aqua',
] as const;

export const AtomBuilder = ({ id, className = '', onPanelChange }: AtomBuilderProps) => {
  const atoms = useEventDraftStore((s) => s.draft.atoms);
  const addAtom = useEventDraftStore((s) => s.addAtom);
  const removeAtom = useEventDraftStore((s) => s.removeAtom);
  const [openPanel, setOpenPanel] = useState<AtomPanel | null>(null);
  const { anchor: accentAnchor } = useDesignVariant('AtomAccent', ATOM_ACCENT_VARIANTS);

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
      <div
        id={id}
        {...accentAnchor}
        tabIndex={id ? -1 : undefined}
        className={`${styles.panelView} ${className}`}
      >
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
    <div
      id={id}
      {...accentAnchor}
      tabIndex={id ? -1 : undefined}
      className={`${styles.container} ${className}`}
    >
      <AtomList atoms={atoms} onRemove={removeAtom} />

      <div className={styles.tileSection}>
        <Heading size="modal" as="h2" className={styles.tileHeading}>
          Особенности
        </Heading>

        <div className={styles.atomButtons}>
          {ATOM_BUTTONS.map(({ kind, label, image, imgOffset }) => (
            <NavTile
              key={kind}
              label={label}
              image={image}
              active
              solidLabel
              style={{ '--tile-img-x': imgOffset.x, '--tile-img-y': imgOffset.y } as CSSProperties}
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

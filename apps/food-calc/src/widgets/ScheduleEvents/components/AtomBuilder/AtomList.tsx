/**
 * AtomList - Display and manage list of atoms
 */

import {
  Atom,
  isScaleAtom,
  isTagAtom,
  isRelationAtom,
} from '@/entities/schedule-event';
import styles from './AtomList.module.css';

export interface AtomListProps {
  atoms: Atom[];
  onRemove: (index: number) => void;
  className?: string;
}

/**
 * Format atom for display
 */
function formatAtom(atom: Atom): string {
  if (isScaleAtom(atom)) {
    const label = atom.label ? ` (${atom.label})` : '';
    return `${atom.value}/10${label}`;
  }
  if (isTagAtom(atom)) {
    return `#${atom.value}`;
  }
  if (isRelationAtom(atom)) {
    return `→ ${atom.value}`;
  }
  return '?';
}

/**
 * Get atom type label
 */
function getAtomKindLabel(kind: Atom['kind']): string {
  const labels: Record<Atom['kind'], string> = {
    scale: 'Оценка',
    tag: 'Тег',
    relation: 'Связь',
  };
  return labels[kind];
}

/**
 * AtomList Component
 *
 * Displays atoms as removable chips
 */
export const AtomList = ({ atoms, onRemove, className = '' }: AtomListProps) => {
  if (!atoms?.length) {
    return null;
  }

  return (
    <div className={`${styles.atomList} ${className}`}>
      {atoms.map((atom, index) => (
        <div key={index} className={styles.atomChip} data-kind={atom.kind}>
          <span className={styles.atomLabel}>{getAtomKindLabel(atom.kind)}</span>
          <span className={styles.atomValue}>{formatAtom(atom)}</span>
          <button
            className={styles.removeButton}
            onClick={() => onRemove(index)}
            aria-label={`Remove ${getAtomKindLabel(atom.kind)}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

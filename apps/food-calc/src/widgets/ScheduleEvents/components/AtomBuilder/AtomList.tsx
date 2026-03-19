/**
 * AtomList - Display and manage list of atoms
 */

import {
  Atom,
  isScaleAtom,
  isTimeAtom,
  isNumberAtom,
  isTagAtom,
  isRelationAtom,
  isFlagAtom,
  isBodyAtom,
} from '@/entities/schedule-event';
import { formatBodyPoints } from './BodyAtomInput';
import styles from './AtomList.module.css';
import { observer } from 'mobx-react-lite';

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
  if (isTimeAtom(atom)) {
    if (atom.durationMin) {
      return `${atom.durationMin} мин`;
    }
    if (atom.start && atom.end) {
      return `${new Date(atom.start).toLocaleTimeString()} - ${new Date(atom.end).toLocaleTimeString()}`;
    }
    if (atom.start) {
      return `С ${new Date(atom.start).toLocaleTimeString()}`;
    }
    if (atom.end) {
      return `До ${new Date(atom.end).toLocaleTimeString()}`;
    }
    return 'Время';
  }
  if (isNumberAtom(atom)) {
    const unit = atom.unit ? ` ${atom.unit}` : '';
    const label = atom.label ? ` (${atom.label})` : '';
    return `${atom.value}${unit}${label}`;
  }
  if (isTagAtom(atom)) {
    return `#${atom.value}`;
  }
  if (isRelationAtom(atom)) {
    return `→ ${atom.value}`;
  }
  if (isFlagAtom(atom)) {
    return `⚡ ${atom.value}`;
  }
  if (isBodyAtom(atom)) {
    const summary = formatBodyPoints(atom.points);
    const label = atom.label ? ` (${atom.label})` : '';
    return `${summary}${label}`;
  }
  return '?';
}

/**
 * Get atom type label
 */
function getAtomKindLabel(kind: Atom['kind']): string {
  const labels: Record<Atom['kind'], string> = {
    scale: 'Оценка',
    time: 'Время',
    number: 'Число',
    tag: 'Тег',
    relation: 'Связь',
    flag: 'Флаг',
    body: 'Тело',
  };
  return labels[kind];
}

/**
 * AtomList Component
 *
 * Displays atoms as removable chips
 */
export const AtomList = observer(({ atoms, onRemove, className = '' }: AtomListProps) => {
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
});

AtomList.displayName = 'AtomList';

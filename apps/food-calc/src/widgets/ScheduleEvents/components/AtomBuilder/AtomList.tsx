/**
 * AtomList — добавленные атомы, сгруппированные по типу
 * (Оценки / Теги / Связи). Тип несёт заголовок секции, поэтому внутри
 * самого чипа kind-label не нужен — чипы стали уже, в ряд влезает 2+.
 */

import { Atom, isScaleAtom, isTagAtom, isRelationAtom } from '@/entities/schedule-event';
import styles from './AtomList.module.css';

export interface AtomListProps {
  atoms: Atom[];
  onRemove: (index: number) => void;
  className?: string;
}

/** Текст значения атома внутри чипа. */
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

const KIND_ORDER: Atom['kind'][] = ['scale', 'tag', 'relation'];

const SECTION_TITLES: Record<Atom['kind'], string> = {
  scale: 'Оценки',
  tag: 'Теги',
  relation: 'Связи',
};

/**
 * AtomList — секции по типу: заголовок + ряд removable-чипов.
 */
export const AtomList = ({ atoms, onRemove, className = '' }: AtomListProps) => {
  if (!atoms?.length) {
    return null;
  }

  // Исходный индекс сохраняем — onRemove адресует позицию в общем массиве.
  const indexed = atoms.map((atom, index) => ({ atom, index }));

  return (
    <div className={`${styles.atomList} ${className}`}>
      {KIND_ORDER.map((kind) => {
        const group = indexed.filter((entry) => entry.atom.kind === kind);
        if (!group.length) return null;

        return (
          <section key={kind} className={styles.section}>
            <h4 className={styles.sectionTitle}>{SECTION_TITLES[kind]}</h4>
            <div className={styles.chips}>
              {group.map(({ atom, index }) => (
                <div key={index} className={styles.atomChip} data-kind={kind}>
                  <span className={styles.atomValue}>{formatAtom(atom)}</span>
                  <button
                    className={styles.removeButton}
                    onClick={() => onRemove(index)}
                    aria-label={`Удалить: ${formatAtom(atom)}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

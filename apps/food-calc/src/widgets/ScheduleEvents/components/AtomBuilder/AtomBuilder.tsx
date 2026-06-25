/**
 * AtomBuilder — manual atom entry for an event. Scale is the manual atom.
 *
 * An event can hold MULTIPLE rated states (one scale atom per phenomenon, e.g.
 * «Настроение 7» + «Энергия 4»). The added states show as chips at the top of
 * the section: tap a chip to edit it (lifts it back into the form), ✕ to remove.
 * The form below edits the current pending scale; «Добавить состояние» commits it
 * and clears the form for the next (the LAST one is also committed on close, so a
 * single-state user never needs the button — just type and close, as before).
 *
 * AtomList still shows legacy non-scale atoms (tag/relation) on OLD events.
 */

import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { isScaleAtom, type ScaleAtom } from '@/entities/schedule-event';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import { AtomList } from './AtomList';
import { ScaleAtomInput } from './ScaleAtomInput';
import styles from './AtomBuilder.module.css';

export interface AtomBuilderProps {
  id?: string;
  className?: string;
  /** Forwarded to `ScaleAtomInput` — `false` opens keyboard-down (inline panel). */
  autoFocusScaleValue?: boolean;
}

export const AtomBuilder = ({ id, className = '', autoFocusScaleValue = true }: AtomBuilderProps) => {
  const atoms = useEventDraftStore((s) => s.draft.atoms);
  const removeAtom = useEventDraftStore((s) => s.removeAtom);
  const hydratePendingScale = useEventDraftStore((s) => s.hydratePendingScale);
  const commitPendingScale = useEventDraftStore((s) => s.commitPendingScale);
  const pendingTouched = useEventDraftStore((s) => s.pendingScale.touched);

  // Keep original indices — onRemove/edit address positions in the full array.
  const indexed = atoms.map((atom, index) => ({ atom, index }));
  const scales = indexed.filter((e): e is { atom: ScaleAtom; index: number } => isScaleAtom(e.atom));
  const legacy = indexed.filter((e) => e.atom.kind !== 'scale');

  // Tap a chip → lift it back into the form to edit (remove from the list;
  // committing re-adds it by label, so changing the label leaves no orphan).
  const editScale = (index: number) => {
    const atom = atoms[index];
    if (atom && isScaleAtom(atom)) {
      hydratePendingScale(atom);
      removeAtom(index);
    }
  };

  return (
    <div id={id} tabIndex={id ? -1 : undefined} className={`${styles.container} ${className}`}>
      {scales.length > 0 && (
        <div className={styles.scaleChips}>
          {scales.map(({ atom, index }) => (
            <span key={index} className={styles.scaleChip}>
              <button type="button" className={styles.scaleChipMain} onClick={() => editScale(index)}>
                <Text as="span" role="caption">
                  {atom.label ? `${atom.label} ` : ''}
                  <b>{atom.value}</b>
                </Text>
              </button>
              <button
                type="button"
                className={styles.scaleChipRemove}
                onClick={() => removeAtom(index)}
                aria-label={`Удалить: ${atom.label ?? atom.value}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <AtomList atoms={legacy.map((e) => e.atom)} onRemove={(i) => removeAtom(legacy[i].index)} />

      {/* Section title directly above the inputs — role-based Heading (the canon
          typography axis; serif-italic `variant` voices are not for new surfaces). */}
      <Heading as="h3" role="title">
        Можно добавить состояние
      </Heading>

      <ScaleAtomInput autoFocusValue={autoFocusScaleValue} />

      {/* «Готово» commits the current pending scale (adds a chip + clears the form
          for the next state); the panel stays open (close is via the chevron).
          Gated by `touched` so an untouched default never attaches a phantom 5/10. */}
      {pendingTouched && (
        <Button variant="system" className={styles.addState} onClick={commitPendingScale}>
          Готово
        </Button>
      )}

      {scales.length === 0 && legacy.length === 0 && (
        <Text as="p" role="caption" className={styles.bottomHint}>
          Оцените состояние по шкале — или просто опишите событие словами.
        </Text>
      )}
    </div>
  );
};

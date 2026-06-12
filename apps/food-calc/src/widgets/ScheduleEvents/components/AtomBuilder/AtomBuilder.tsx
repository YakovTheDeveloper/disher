/**
 * AtomBuilder — manual atom entry for an event. Scale-only since 2026-06-12.
 *
 * Tag/Relation tiles were removed: the cause/category a user used to pick from
 * presets now lives in the event's free text, and the analysis LLM mines it
 * (EVENTS_MINING_INSTRUCTION on the backend). The remaining manual atom is the
 * Scale — magnitude (7/10) is the one signal free text reliably loses.
 *
 * The scale lives in the form (`pendingScale`), committed by the modal's
 * «Готово». So AtomList here shows ONLY the non-scale atoms — i.e. tag/relation
 * atoms on OLD events being edited — removable. New events have none, so the
 * list collapses to nothing and only the scale form shows.
 */

import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { AtomList } from './AtomList';
import { ScaleAtomInput } from './ScaleAtomInput';
import styles from './AtomBuilder.module.css';

export interface AtomBuilderProps {
  id?: string;
  className?: string;
}

export const AtomBuilder = ({ id, className = '' }: AtomBuilderProps) => {
  const atoms = useEventDraftStore((s) => s.draft.atoms);
  const removeAtom = useEventDraftStore((s) => s.removeAtom);

  // The scale is edited in the form below — show only legacy tag/relation atoms
  // here. Keep original indices so onRemove still addresses the full atoms array.
  const legacy = atoms.map((atom, index) => ({ atom, index })).filter((e) => e.atom.kind !== 'scale');

  return (
    <div id={id} tabIndex={id ? -1 : undefined} className={`${styles.container} ${className}`}>
      <AtomList atoms={legacy.map((e) => e.atom)} onRemove={(i) => removeAtom(legacy[i].index)} />

      <ScaleAtomInput />

      {/* Подсказка — мелким, ПОД шкалой и пилюлями (просьба 2026-06-13). */}
      {legacy.length === 0 && (
        <p className={styles.bottomHint}>
          Оцените состояние по шкале — или просто опишите событие словами.
        </p>
      )}
    </div>
  );
};

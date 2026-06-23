// Pending-scale lifecycle — the core of the «one button» fix: the Оценка modal
// edits a single `pendingScale`, and «Готово»/close calls commitPendingScale().
// The regression these guard: a typed rating must NOT be silently dropped, and
// an untouched form must NOT attach a phantom 5/10.
import { describe, it, expect, beforeEach } from 'vitest';
import { useEventDraftStore } from './draft';

beforeEach(() => useEventDraftStore.getState().clear());

describe('pendingScale → commitPendingScale', () => {
  it('commits a touched scale into atoms («Готово» saves the rating)', () => {
    const s = useEventDraftStore.getState();
    s.setPendingScale({ value: 7, label: 'Боль' });
    s.commitPendingScale();
    expect(useEventDraftStore.getState().draft.atoms).toEqual([
      { kind: 'scale', value: 7, label: 'Боль' },
    ]);
  });

  it('does NOT attach a phantom scale when the form was never touched', () => {
    useEventDraftStore.getState().commitPendingScale();
    expect(useEventDraftStore.getState().draft.atoms).toEqual([]);
  });

  it('commits with an undefined label when none entered', () => {
    const s = useEventDraftStore.getState();
    s.setPendingScale({ value: 8 });
    s.commitPendingScale();
    expect(useEventDraftStore.getState().draft.atoms).toEqual([
      { kind: 'scale', value: 8, label: undefined },
    ]);
  });

  it('upserts — a second commit replaces the existing scale, not duplicates it', () => {
    const s = useEventDraftStore.getState();
    s.setPendingScale({ value: 7, label: 'Боль' });
    s.commitPendingScale();
    s.hydratePendingScale({ value: 3, label: 'Боль' });
    s.setPendingScale({ value: 4 });
    s.commitPendingScale();
    const scales = useEventDraftStore.getState().draft.atoms.filter((a) => a.kind === 'scale');
    expect(scales).toEqual([{ kind: 'scale', value: 4, label: 'Боль' }]);
  });

  it('appends a DIFFERENT label as a second state (multiple states per event)', () => {
    const s = useEventDraftStore.getState();
    s.setPendingScale({ value: 7, label: 'Настроение' });
    s.commitPendingScale();
    s.setPendingScale({ value: 4, label: 'Энергия' });
    s.commitPendingScale();
    const scales = useEventDraftStore.getState().draft.atoms.filter((a) => a.kind === 'scale');
    expect(scales).toEqual([
      { kind: 'scale', value: 7, label: 'Настроение' },
      { kind: 'scale', value: 4, label: 'Энергия' },
    ]);
  });

  it('keeps legacy tag/relation atoms when upserting the scale', () => {
    const s = useEventDraftStore.getState();
    s.addAtom({ kind: 'tag', value: 'работа' });
    s.setPendingScale({ value: 6, label: 'Стресс' });
    s.commitPendingScale();
    expect(useEventDraftStore.getState().draft.atoms).toEqual([
      { kind: 'tag', value: 'работа' },
      { kind: 'scale', value: 6, label: 'Стресс' },
    ]);
  });

  it('clearAtoms also resets the pending scale (no leak across days/events)', () => {
    const s = useEventDraftStore.getState();
    s.setPendingScale({ value: 9, label: 'Тревога' });
    s.clearAtoms();
    const p = useEventDraftStore.getState().pendingScale;
    expect(p.touched).toBe(false);
    expect(p.value).toBe(5);
    expect(p.label).toBe('');
  });
});

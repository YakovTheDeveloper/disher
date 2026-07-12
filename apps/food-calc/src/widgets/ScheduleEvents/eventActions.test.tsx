import { describe, it, expect, vi } from 'vitest';
import { buildEventEditActions } from './eventActions';
import { EDIT_MODAL_INPUT_IDS } from './ui/ScheduleEventEditModal.constants';

describe('buildEventEditActions — event drawer medal row', () => {
  it('builds 3 medals in order Особенности · Описание · Время, each wired to its edit-input', () => {
    const actions = buildEventEditActions(vi.fn());
    expect(actions.map((a) => a.label)).toEqual(['Особенности', 'Описание', 'Время']);
    expect(actions.map((a) => a.htmlFor)).toEqual([
      EDIT_MODAL_INPUT_IDS.ATOMS_INPUT,
      EDIT_MODAL_INPUT_IDS.TEXT_INPUT,
      EDIT_MODAL_INPUT_IDS.TIME_INPUT,
    ]);
    // Every medal carries a center glyph.
    expect(actions.every((a) => a.icon != null)).toBe(true);
  });

  it('onClick only primes (no per-step arg) — the step is set by focus delegation', () => {
    const prime = vi.fn();
    const actions = buildEventEditActions(prime);
    actions.forEach((a) => a.onClick());
    expect(prime).toHaveBeenCalledTimes(3);
  });
});

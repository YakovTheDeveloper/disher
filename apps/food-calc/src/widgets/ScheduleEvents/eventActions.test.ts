import { describe, it, expect, vi } from 'vitest';
import { buildEventEditActions } from './eventActions';

describe('buildEventEditActions — event drawer 3 field editors', () => {
  it('builds exactly 3 actions with the right labels', () => {
    const actions = buildEventEditActions(vi.fn());
    expect(actions.map((a) => a.label)).toEqual([
      'Редактировать время',
      'Редактировать описание',
      'Редактировать особенности',
    ]);
  });

  it('each action calls onEdit with its step', () => {
    const onEdit = vi.fn();
    const actions = buildEventEditActions(onEdit);
    actions[0].onClick();
    actions[1].onClick();
    actions[2].onClick();
    expect(onEdit.mock.calls).toEqual([['time'], ['text'], ['atoms']]);
  });
});

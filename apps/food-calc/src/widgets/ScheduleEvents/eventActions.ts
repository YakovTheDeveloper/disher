import type { ItemAction } from '@/features/shared/item-actions-drawer';

export type EventEditStep = 'time' | 'text' | 'atoms';

/**
 * The three field-editor actions for a day-event's per-item drawer. Events have
 * no detail page, so these replace the «Информация о…» action that food/dish
 * rows get. Pure + testable; `onEdit` opens the existing edit modal at a step.
 */
export function buildEventEditActions(onEdit: (step: EventEditStep) => void): ItemAction[] {
  return [
    { label: 'Редактировать время', onClick: () => onEdit('time') },
    { label: 'Редактировать описание', onClick: () => onEdit('text') },
    { label: 'Редактировать особенности', onClick: () => onEdit('atoms') },
  ];
}

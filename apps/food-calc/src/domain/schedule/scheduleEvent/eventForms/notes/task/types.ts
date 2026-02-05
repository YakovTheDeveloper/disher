// ============================================================================
// TASK SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для задач
 */
export type TaskSubtype =
    | 'priority_low'  // Низкий приоритет
    | 'priority_medium' // Средний приоритет
    | 'priority_high' // Высокий приоритет
    | 'urgent'        // Срочно
    | 'delegated'     // Делегировано
    | 'recurring';    // Повторяющаяся

/**
 * Опции подтипов для селекта
 */
export const TASK_SUBTYPES: { value: TaskSubtype; labelKey: string }[] = [
    { value: 'priority_low', labelKey: 'subtype.task.priority_low' },
    { value: 'priority_medium', labelKey: 'subtype.task.priority_medium' },
    { value: 'priority_high', labelKey: 'subtype.task.priority_high' },
    { value: 'urgent', labelKey: 'subtype.task.urgent' },
    { value: 'delegated', labelKey: 'subtype.task.delegated' },
    { value: 'recurring', labelKey: 'subtype.task.recurring' },
];

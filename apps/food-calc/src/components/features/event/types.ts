import { EventSubtype } from '@/domain/schedule/scheduleEvent/eventTypes';

/**
 * Конфигурация подтипа с возможными дочерними элементами
 */
export interface SubtypeOption {
    value: EventSubtype;
    labelKey: string;
    children?: SubtypeOption[];
}

/**
 * Элемент стека выбранных категорий
 */
export interface StackItem {
    value: EventSubtype;
    label: string;
    depth: number;
}

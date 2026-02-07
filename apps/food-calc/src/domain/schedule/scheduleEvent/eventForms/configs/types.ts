import { BaseEventType, EventSubtype } from '../../eventTypes';
import { SubtypeOption } from '@/components/features/event/SubtypeTreeSelector';

/**
 * Типы полей формы
 */
export type FormFieldType =
    | 'slider'        // Слайдер 1-10
    | 'quick-buttons'
    | 'time'          // Время (HH:mm)
    | 'duration'      // Продолжительность (часы:минуты)
    | 'text'          // Текстовое поле
    | 'select'        // Выбор подтипа
    | 'multiSelect'   // Множественный выбор
    | 'steps'         // Количество шагов
    | 'tree';         // Древовидный выбор подтипов

/**
 * Конфигурация валидации поля
 */
export interface ValidationRule {
    /** Минимальное значение */
    min?: number;
    /** Максимальное значение */
    max?: number;
    /** Минимальная длина текста */
    minLength?: number;
    /** Максимальная длина текста */
    maxLength?: number;
    /** Обязательное поле */
    required?: boolean;
    /** Сообщение об ошибке */
    errorMessage?: string;
}

/**
 * Условие видимости поля - показывать поле только когда другое поле имеет определённое значение
 */
export interface FieldVisibilityCondition {
    /** Ключ поля, от которого зависит видимость */
    field: string;
    /** Значение, при котором поле становится видимым */
    equals: any;
}

/**
 * Конфигурация поля формы
 */
export interface FormFieldConfig {
    key: string;
    type: FormFieldType;
    labelKey: string;
    /** Показывать ли лейбл (по умолчанию: true) */
    showLabel?: boolean;
    /** Дополнительный контент справа от лейбла */
    labelAside?: React.ReactNode;
    /** Единица измерения (для числовых полей) */
    unit?: string;
    validation?: ValidationRule;
    defaultValue?: number | string | EventSubtype[];
    /** Шаг для числовых полей */
    step?: number;
    /** Варианты для select/multiSelect/quickButtons/tree */
    options?: { value: string; labelKey: string; children?: { value: string; labelKey: string }[] }[];
    /** Отображать ли поле (можно скрыть для некоторых подтипов) */
    visible?: boolean;
    /** Скрытое по умолчанию поле (раскрывается кнопкой "Показать расширенные") */
    advanced?: boolean;
    /** Условие видимости - поле показывается только когда field === equals */
    visibleWhen?: FieldVisibilityCondition;
    /** Максимальная глубина вложенности для tree типа */
    maxDepth?: number;
}

export interface EventFormConfig {
    eventType: BaseEventType;
    fields: FormFieldConfig[];
    serializedFields: string[];
}

export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

export interface EventData {
    type: BaseEventType;
    subtype?: string[];
    [key: string]: number | string | undefined | string[];
}

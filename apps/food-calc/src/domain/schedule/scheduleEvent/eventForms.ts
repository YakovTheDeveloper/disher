import { BaseEventType, EventSubtype } from './eventTypes';

/**
 * Типы полей формы
 */
export type FormFieldType =
    | 'slider'        // Слайдер 1-10
    | 'time'          // Время (HH:mm)
    | 'duration'      // Продолжительность (часы:минуты)
    | 'text'          // Текстовое поле
    | 'select'        // Выбор подтипа
    | 'multiSelect'   // Множественный выбор
    | 'steps';        // Количество шагов

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
 * Конфигурация поля формы
 */
export interface FormFieldConfig {
    /** Ключ поля */
    key: string;
    /** Тип поля */
    type: FormFieldType;
    /** Метка поля */
    labelKey: string;
    /** Единица измерения (для числовых полей) */
    unit?: string;
    /** Конфигурация валидации */
    validation?: ValidationRule;
    /** Значения по умолчанию */
    defaultValue?: number | string;
    /** Шаг для числовых полей */
    step?: number;
    /** Варианты для select/multiSelect */
    options?: { value: string; labelKey: string }[];
    /** Отображать ли поле (можно скрыть для некоторых подтипов) */
    visible?: boolean;
}

/**
 * Конфигурация формы события
 */
export interface EventFormConfig {
    /** Тип события */
    eventType: BaseEventType;
    /** Поля формы в порядке отображения */
    fields: FormFieldConfig[];
    /** Поля, которые сериализуются в value */
    serializedFields: string[];
}

/**
 * Валидация значения
 */
export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

/**
 * Валидировать поле формы
 */
export function validateField(
    value: number | string,
    field: FormFieldConfig
): ValidationResult {
    if (field.validation?.required && (value === '' || value === undefined || value === null)) {
        return { isValid: false, errorMessage: field.validation.errorMessage || 'Обязательное поле' };
    }

    if (field.type === 'slider' || field.type === 'steps') {
        const numValue = Number(value);
        if (field.validation?.min !== undefined && numValue < field.validation.min) {
            return { isValid: false, errorMessage: field.validation.errorMessage || `Минимум ${field.validation.min}` };
        }
        if (field.validation?.max !== undefined && numValue > field.validation.max) {
            return { isValid: false, errorMessage: field.validation.errorMessage || `Максимум ${field.validation.max}` };
        }
    }

    if (field.type === 'text') {
        const strValue = String(value);
        if (field.validation?.minLength !== undefined && strValue.length < field.validation.minLength) {
            return { isValid: false, errorMessage: field.validation.errorMessage || `Минимум ${field.validation.minLength} символов` };
        }
        if (field.validation?.maxLength !== undefined && strValue.length > field.validation.maxLength) {
            return { isValid: false, errorMessage: field.validation.errorMessage || `Максимум ${field.validation.maxLength} символов` };
        }
    }

    return { isValid: true };
}

/**
 * Конфигурация подтипов для illness
 */
const ILLNESS_SUBTYPES: { value: EventSubtype; labelKey: string }[] = [
    { value: 'headache', labelKey: 'subtype.illness.headache' },
    { value: 'cold', labelKey: 'subtype.illness.cold' },
    { value: 'fever', labelKey: 'subtype.illness.fever' },
    { value: 'cough', labelKey: 'subtype.illness.cough' },
    { value: 'nausea', labelKey: 'subtype.illness.nausea' },
    { value: 'allergy', labelKey: 'subtype.illness.allergy' },
    { value: 'pain', labelKey: 'subtype.illness.pain' },
    { value: 'fatigue', labelKey: 'subtype.illness.fatigue' },
];

/**
 * Конфигурация подтипов для digestion
 */
const DIGESTION_SUBTYPES: { value: EventSubtype; labelKey: string }[] = [
    { value: 'bloating', labelKey: 'subtype.digestion.bloating' },
    { value: 'stomach_pain', labelKey: 'subtype.digestion.stomach_pain' },
    { value: 'heartburn', labelKey: 'subtype.digestion.heartburn' },
    { value: 'constipation', labelKey: 'subtype.digestion.constipation' },
    { value: 'diarrhea', labelKey: 'subtype.digestion.diarrhea' },
];

/**
 * Конфигурация подтипов для medication
 */
const MEDICATION_SUBTYPES: { value: EventSubtype; labelKey: string }[] = [
    { value: 'pill', labelKey: 'subtype.medication.pill' },
    { value: 'drops', labelKey: 'subtype.medication.drops' },
    { value: 'injection', labelKey: 'subtype.medication.injection' },
    { value: 'syrup', labelKey: 'subtype.medication.syrup' },
    { value: 'topical', labelKey: 'subtype.medication.topical' },
    { value: 'other', labelKey: 'subtype.medication.other' },
];

/**
 * Конфигурация подтипов для stress
 */
const STRESS_SUBTYPES: { value: EventSubtype; labelKey: string }[] = [
    { value: 'work', labelKey: 'subtype.stress.work' },
    { value: 'personal', labelKey: 'subtype.stress.personal' },
    { value: 'financial', labelKey: 'subtype.stress.financial' },
    { value: 'health', labelKey: 'subtype.stress.health' },
    { value: 'relationship', labelKey: 'subtype.stress.relationship' },
];

/**
 * Конфигурация подтипов для social
 */
const SOCIAL_SUBTYPES: { value: EventSubtype; labelKey: string }[] = [
    { value: 'friends', labelKey: 'subtype.social.friends' },
    { value: 'family', labelKey: 'subtype.social.family' },
    { value: 'partner', labelKey: 'subtype.social.partner' },
    { value: 'work_meeting', labelKey: 'subtype.social.work_meeting' },
    { value: 'party', labelKey: 'subtype.social.party' },
    { value: 'call', labelKey: 'subtype.social.call' },
    { value: 'date', labelKey: 'subtype.social.date' },
];

/**
 * Конфигурация подтипов для activity
 */
const ACTIVITY_SUBTYPES: { value: EventSubtype; labelKey: string }[] = [
    { value: 'sport', labelKey: 'subtype.activity.sport' },
    { value: 'walk', labelKey: 'subtype.activity.walk' },
    { value: 'exercise', labelKey: 'subtype.activity.exercise' },
    { value: 'steps', labelKey: 'subtype.activity.steps' },
];

/**
 * Формы для каждого типа события
 */
export const EVENT_FORMS: Record<BaseEventType, EventFormConfig> = {
    // === PHYSICAL ===
    sleep: {
        eventType: 'sleep',
        fields: [
            {
                key: 'quality',
                type: 'slider',
                labelKey: 'field.sleep.quality',
                validation: { min: 1, max: 10, required: true, errorMessage: 'Оценка от 1 до 10' },
                defaultValue: 5,
            },
            {
                key: 'duration',
                type: 'duration',
                labelKey: 'field.sleep.duration',
                validation: { min: 0, max: 24, required: true, errorMessage: 'Максимум 24 часа' },
                defaultValue: 7,
            },
        ],
        serializedFields: ['quality', 'duration'],
    },
    illness: {
        eventType: 'illness',
        fields: [
            {
                key: 'subtype',
                type: 'select',
                labelKey: 'field.illness.subtype',
                options: ILLNESS_SUBTYPES,
                validation: { required: true, errorMessage: 'Выберите тип недуга' },
            },
            {
                key: 'intensity',
                type: 'slider',
                labelKey: 'field.illness.intensity',
                validation: { min: 1, max: 10, required: true, errorMessage: 'Интенсивность от 1 до 10' },
                defaultValue: 5,
            },
            {
                key: 'notes',
                type: 'text',
                labelKey: 'field.illness.notes',
                validation: { maxLength: 200 },
            },
        ],
        serializedFields: ['subtype', 'intensity', 'notes'],
    },
    digestion: {
        eventType: 'digestion',
        fields: [
            {
                key: 'subtype',
                type: 'select',
                labelKey: 'field.digestion.subtype',
                options: DIGESTION_SUBTYPES,
                validation: { required: true, errorMessage: 'Выберите симптом' },
            },
            {
                key: 'intensity',
                type: 'slider',
                labelKey: 'field.digestion.intensity',
                validation: { min: 1, max: 10, required: true, errorMessage: 'Интенсивность от 1 до 10' },
                defaultValue: 5,
            },
        ],
        serializedFields: ['subtype', 'intensity'],
    },
    medication: {
        eventType: 'medication',
        fields: [
            {
                key: 'subtype',
                type: 'select',
                labelKey: 'field.medication.subtype',
                options: MEDICATION_SUBTYPES,
                validation: { required: true, errorMessage: 'Выберите тип лекарства' },
            },
            {
                key: 'name',
                type: 'text',
                labelKey: 'field.medication.name',
                validation: { required: true, minLength: 2, maxLength: 100, errorMessage: 'Введите название' },
            },
            {
                key: 'dosage',
                type: 'text',
                labelKey: 'field.medication.dosage',
                validation: { maxLength: 50 },
            },
        ],
        serializedFields: ['subtype', 'name', 'dosage'],
    },

    // === MENTAL ===
    mood: {
        eventType: 'mood',
        fields: [
            {
                key: 'value',
                type: 'slider',
                labelKey: 'field.mood.value',
                validation: { min: 1, max: 10, required: true, errorMessage: 'Оценка от 1 до 10' },
                defaultValue: 5,
            },
        ],
        serializedFields: ['value'],
    },
    energy: {
        eventType: 'energy',
        fields: [
            {
                key: 'value',
                type: 'slider',
                labelKey: 'field.energy.value',
                validation: { min: 1, max: 10, required: true, errorMessage: 'Оценка от 1 до 10' },
                defaultValue: 5,
            },
        ],
        serializedFields: ['value'],
    },
    stress: {
        eventType: 'stress',
        fields: [
            {
                key: 'subtype',
                type: 'select',
                labelKey: 'field.stress.subtype',
                options: STRESS_SUBTYPES,
                validation: { required: true, errorMessage: 'Выберите источник стресса' },
            },
            {
                key: 'level',
                type: 'slider',
                labelKey: 'field.stress.level',
                validation: { min: 1, max: 10, required: true, errorMessage: 'Уровень от 1 до 10' },
                defaultValue: 5,
            },
        ],
        serializedFields: ['subtype', 'level'],
    },
    focus: {
        eventType: 'focus',
        fields: [
            {
                key: 'value',
                type: 'slider',
                labelKey: 'field.focus.value',
                validation: { min: 1, max: 10, required: true, errorMessage: 'Оценка от 1 до 10' },
                defaultValue: 5,
            },
            {
                key: 'duration',
                type: 'duration',
                labelKey: 'field.focus.duration',
                validation: { min: 0, max: 12, required: false, errorMessage: 'Максимум 12 часов' },
            },
        ],
        serializedFields: ['value', 'duration'],
    },

    // === ACTIVITY ===
    activity: {
        eventType: 'activity',
        fields: [
            {
                key: 'subtype',
                type: 'select',
                labelKey: 'field.activity.subtype',
                options: ACTIVITY_SUBTYPES,
                validation: { required: true, errorMessage: 'Выберите тип активности' },
            },
            {
                key: 'duration',
                type: 'duration',
                labelKey: 'field.activity.duration',
                validation: { min: 0, max: 8, required: false, errorMessage: 'Максимум 8 часов' },
            },
            {
                key: 'intensity',
                type: 'slider',
                labelKey: 'field.activity.intensity',
                validation: { min: 1, max: 10, required: false },
                defaultValue: 5,
            },
        ],
        serializedFields: ['subtype', 'duration', 'intensity'],
    },

    // === SOCIAL ===
    social: {
        eventType: 'social',
        fields: [
            {
                key: 'subtype',
                type: 'select',
                labelKey: 'field.social.subtype',
                options: SOCIAL_SUBTYPES,
                validation: { required: true, errorMessage: 'Выберите тип социальной активности' },
            },
            {
                key: 'duration',
                type: 'duration',
                labelKey: 'field.social.duration',
                validation: { min: 0, max: 12, required: false, errorMessage: 'Максимум 12 часов' },
            },
            {
                key: 'notes',
                type: 'text',
                labelKey: 'field.social.notes',
                validation: { maxLength: 200 },
            },
        ],
        serializedFields: ['subtype', 'duration', 'notes'],
    },

    // === NOTES ===
    note: {
        eventType: 'note',
        fields: [
            {
                key: 'content',
                type: 'text',
                labelKey: 'field.note.content',
                validation: { required: true, minLength: 1, maxLength: 500, errorMessage: 'Введите текст заметки' },
            },
        ],
        serializedFields: ['content'],
    },
    custom: {
        eventType: 'custom',
        fields: [
            {
                key: 'name',
                type: 'text',
                labelKey: 'field.custom.name',
                validation: { required: true, minLength: 1, maxLength: 100, errorMessage: 'Введите название' },
            },
            {
                key: 'value',
                type: 'text',
                labelKey: 'field.custom.value',
                validation: { maxLength: 200 },
            },
        ],
        serializedFields: ['name', 'value'],
    },
};

/**
 * Получить конфигурацию формы для типа события
 */
export function getEventFormConfig(type: BaseEventType): EventFormConfig {
    return EVENT_FORMS[type];
}

/**
 * Интерфейс данных события для сериализации
 */
export interface EventData {
    type: BaseEventType;
    subtype?: EventSubtype;
    [key: string]: number | string | undefined;
}

/**
 * Сериализовать данные события в строку для сервера
 * Формат: "type|subtype|field1|field2|..."
 */
export function serializeEvent(data: EventData): string {
    const parts: string[] = [data.type];

    if (data.subtype) {
        parts.push(data.subtype);
    }

    // Добавляем остальные поля в порядке, определённом в formConfig
    const formConfig = getEventFormConfig(data.type);

    for (const fieldKey of formConfig.serializedFields) {
        if (fieldKey === 'subtype' || fieldKey === 'type') continue;

        const value = data[fieldKey];
        if (value !== undefined && value !== null) {
            parts.push(String(value));
        } else {
            parts.push('');
        }
    }

    return parts.join('|');
}

/**
 * Десериализовать строку с сервера в данные события
 */
export function deserializeEvent(serialized: string): EventData {
    const parts = serialized.split('|');

    if (parts.length === 0) {
        throw new Error('Invalid serialized event format');
    }

    const type = parts[0] as BaseEventType;
    const formConfig = getEventFormConfig(type);

    const data: EventData = { type };

    // subtype - второй элемент, если есть
    if (formConfig.fields.some(f => f.key === 'subtype') && parts.length > 1) {
        data.subtype = parts[1] as EventSubtype;
    }

    // Остальные поля
    const serializedFields = formConfig.serializedFields.filter(f => f !== 'subtype');
    let partIndex = formConfig.fields.some(f => f.key === 'subtype') ? 2 : 1;

    for (const fieldKey of serializedFields) {
        if (partIndex < parts.length) {
            const value = parts[partIndex];
            // Попытка преобразовать в число, если возможно
            data[fieldKey] = value === '' ? undefined : (isNaN(Number(value)) ? value : Number(value));
        }
        partIndex++;
    }

    return data;
}

/**
 * Создать пустые данные события для типа
 */
export function createEmptyEventData(type: BaseEventType): EventData {
    const formConfig = getEventFormConfig(type);
    const data: EventData = { type };

    for (const field of formConfig.fields) {
        if (field.defaultValue !== undefined) {
            data[field.key] = field.defaultValue;
        } else if (field.type === 'text') {
            data[field.key] = '';
        } else if (field.type === 'slider' || field.type === 'steps') {
            data[field.key] = field.validation?.min || 0;
        }
    }

    return data;
}

/**
 * Валидировать все поля формы события
 */
export function validateEventForm(data: EventData): { isValid: boolean; errors: Record<string, string> } {
    const formConfig = getEventFormConfig(data.type);
    const errors: Record<string, string> = {};

    for (const field of formConfig.fields) {
        const value = data[field.key] ?? (field.type === 'text' ? '' : 0);
        const result = validateField(value, field);

        if (!result.isValid) {
            errors[field.key] = result.errorMessage || 'Ошибка валидации';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
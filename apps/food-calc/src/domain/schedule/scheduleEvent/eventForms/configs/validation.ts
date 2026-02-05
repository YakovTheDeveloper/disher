import { FormFieldConfig, ValidationResult, EventData } from './types';
import { EVENT_FORMS } from '../eventFormsMap';

/**
 * Валидировать поле формы
 */
export function validateField(
    value: number | string | string[],
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
 * Валидировать все поля формы события
 */
export function validateEventForm(data: EventData): { isValid: boolean; errors: Record<string, string> } {
    const formConfig = EVENT_FORMS[data.type];
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

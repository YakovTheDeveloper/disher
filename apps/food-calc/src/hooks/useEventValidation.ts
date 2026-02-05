import { useMemo, useCallback } from 'react';
import { EventData, EventFormConfig, FormFieldConfig } from '@/domain/schedule/scheduleEvent/eventForms/types';
import { validateField, validateEventForm } from '@/domain/schedule/scheduleEvent/eventForms/validation';

interface UseEventValidationReturn {
    /** Результат валидации всей формы */
    validation: { isValid: boolean; errors: Record<string, string> };
    /** Валидировать отдельное поле */
    validateField: (fieldKey: string, value: number | string) => { isValid: boolean; errorMessage?: string };
    /** Проверить конкретное поле на наличие ошибки */
    getFieldError: (fieldKey: string) => string | undefined;
}

/**
 * Хук для валидации данных события
 */
export function useEventValidation(
    data: EventData,
    formConfig: EventFormConfig
): UseEventValidationReturn {
    /** Валидация всей формы */
    const validation = useMemo(() =>
        validateEventForm(data),
        [data]
    );

    /** Валидировать отдельное поле */
    const validateFieldFn = useCallback((fieldKey: string, value: number | string) => {
        const field = formConfig.fields.find(f => f.key === fieldKey);
        if (!field) {
            return { isValid: true };
        }
        return validateField(value, field);
    }, [formConfig.fields]);

    /** Получить ошибку конкретного поля */
    const getFieldError = useCallback((fieldKey: string) => {
        return validation.errors[fieldKey];
    }, [validation.errors]);

    return {
        validation,
        validateField: validateFieldFn,
        getFieldError,
    };
}
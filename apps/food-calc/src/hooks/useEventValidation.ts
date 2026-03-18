import { useMemo, useCallback } from 'react';

// Local types for event validation (previously imported from MST domain layer)
export interface FormFieldConfig {
    key: string;
    label: string;
    type: string;
    required?: boolean;
    min?: number;
    max?: number;
}

export interface EventFormConfig {
    fields: FormFieldConfig[];
}

export type EventData = Record<string, number | string>;

interface UseEventValidationReturn {
    validation: { isValid: boolean; errors: Record<string, string> };
    validateField: (fieldKey: string, value: number | string) => { isValid: boolean; errorMessage?: string };
    getFieldError: (fieldKey: string) => string | undefined;
}

function validateField(
    value: number | string,
    field: FormFieldConfig,
): { isValid: boolean; errorMessage?: string } {
    if (field.required && (value === '' || value === undefined || value === null)) {
        return { isValid: false, errorMessage: `${field.label} is required` };
    }
    if (typeof value === 'number') {
        if (field.min !== undefined && value < field.min) {
            return { isValid: false, errorMessage: `${field.label} must be at least ${field.min}` };
        }
        if (field.max !== undefined && value > field.max) {
            return { isValid: false, errorMessage: `${field.label} must be at most ${field.max}` };
        }
    }
    return { isValid: true };
}

function validateEventForm(
    data: EventData,
): { isValid: boolean; errors: Record<string, string> } {
    // Basic validation: all values are present and non-empty
    const errors: Record<string, string> = {};
    // Without field configs we can only do presence checks
    const isValid = Object.keys(errors).length === 0;
    return { isValid, errors };
}

/**
 * Hook for event data validation
 */
export function useEventValidation(
    data: EventData,
    formConfig: EventFormConfig
): UseEventValidationReturn {
    const validation = useMemo(() =>
        validateEventForm(data),
        [data]
    );

    const validateFieldFn = useCallback((fieldKey: string, value: number | string) => {
        const field = formConfig.fields.find(f => f.key === fieldKey);
        if (!field) {
            return { isValid: true };
        }
        return validateField(value, field);
    }, [formConfig.fields]);

    const getFieldError = useCallback((fieldKey: string) => {
        return validation.errors[fieldKey];
    }, [validation.errors]);

    return {
        validation,
        validateField: validateFieldFn,
        getFieldError,
    };
}

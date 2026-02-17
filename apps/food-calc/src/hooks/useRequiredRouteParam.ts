import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface UseRequiredRouteParamOptions {
    /** URL для редиректа, если параметр отсутствует */
    navigateToUrlOnFail: string;
    /** Имя параметра (по умолчанию 'id') */
    paramName?: string;
}

interface UseRequiredRouteParamReturn<T extends string = string> {
    /** Значение параметра или null */
    paramId: T | null;
    /** Флаг валидности - true если параметр присутствует */
    isValid: boolean;
}

/**
 * Хук для получения обязательного параметра из URL.
 * При отсутствии параметра автоматически выполняет редирект.
 * 
 * @param navigateToUrlOnFail - URL для редиректа при отсутствии параметра
 * @param paramName - имя параметра (по умолчанию 'id')
 * @returns { paramId, isValid }
 */
export function useRequiredRouteParam<T extends string = string>(
    options: UseRequiredRouteParamOptions
): UseRequiredRouteParamReturn<T> {
    const { navigateToUrlOnFail, paramName = 'id' } = options;
    const params = useParams();
    const navigate = useNavigate();

    const paramId = params[paramName] as T | null;
    const isValid = paramId !== null && paramId !== undefined;

    useEffect(() => {
        if (!isValid) {
            navigate(navigateToUrlOnFail);
        }
    }, [isValid, navigate, navigateToUrlOnFail]);

    return {
        paramId,
        isValid,
    };
}

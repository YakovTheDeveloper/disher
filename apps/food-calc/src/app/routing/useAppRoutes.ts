import { useNavigate, useLocation } from 'react-router';
import { RouterLinks, RouterUrls, getScheduleFoodUrl, getScheduleEventUrl, getDishFoodDraftUrl } from '@/router';

export interface UseAppRoutesOptions {
    /** Fallback URL when there's no history to go back to */
    fallbackUrl?: string;
}

export interface UseAppRoutesReturn {
    /** Standard navigate function */
    navigate: ReturnType<typeof useNavigate>;
    /** Current location */
    location: ReturnType<typeof useLocation>;
    /** Go back with fallback support */
    goBack: (fallback?: string) => void;
    /** Navigate to root */
    toRoot: () => void;
    /** Navigate to daily norms list */
    toDailyNorms: () => void;
    /** Navigate to daily norm by ID */
    toDailyNorm: (id: string) => void;
    /** Navigate to dish builder (create new) */
    toDishBuilder: () => void;
    /** Navigate to dish by ID */
    toDish: (id: string) => void;
    /** Navigate to dish food draft */
    toDishFoodDraft: (id: string) => void;
    /** Navigate to dish food by child ID */
    toDishFood: (id: string, childId: string) => void;
    /** Navigate to schedule list */
    toSchedule: () => void;
    /** Navigate to schedule builder by ID */
    toScheduleBuilder: (id: string) => void;
    /** Navigate to schedule food */
    toScheduleFood: (id: string, childId: string) => void;
    /** Navigate to schedule event */
    toScheduleEvent: (id: string, childId: string) => void;
    /** Navigate to load data page */
    toLoadData: () => void;
    /** Navigate to dishes list */
    toDishes: () => void;
    /** Navigate to user product by ID */
    toUserProduct: (id: string) => void;
    /** Navigate to test page */
    toTest: () => void;
}

/**
 * Хук для навигации с типизированными методами для всех маршрутов приложения.
 * Инкапсулирует useNavigate и предоставляет удобные методы для переходов между страницами.
 * 
 * @example
 * ```tsx
 * const { toDish, toSchedule, goBack } = useAppRoutes({ fallbackUrl: '/' });
 * 
 * // Переход к блюду
 * toDish('123');
 * 
 * // Переход назад с fallback
 * goBack('/');
 * ```
 */
export const useAppRoutes = (options?: UseAppRoutesOptions): UseAppRoutesReturn => {
    const navigate = useNavigate();
    const location = useLocation();
    const fallbackUrl = options?.fallbackUrl ?? RouterLinks.Root;

    const goBack = (fallback?: string) => {
        const targetUrl = fallback ?? fallbackUrl;

        // Проверяем, есть ли история для возврата назад
        if (location.key === 'default') {
            // Нет истории, используем fallback
            navigate(targetUrl, { replace: true });
        } else {
            // Есть история, пробуем вернуться назад
            navigate(-1);
        }
    };

    const toRoot = () => navigate(RouterLinks.Root);
    const toDailyNorms = () => navigate(RouterLinks.DailyNorms);
    const toDailyNorm = (id: string) => navigate(`${RouterLinks.DailyNorms}/${id}`);
    const toDishBuilder = () => navigate(RouterLinks.DishBuilder);
    const toDish = (id: string) => navigate(RouterUrls.getDish(id));
    const toDishFoodDraft = (id: string) => navigate(getDishFoodDraftUrl(id));
    const toDishFood = (id: string, childId: string) => navigate(`/dish/${id}/food/${childId}`);
    const toSchedule = () => navigate(RouterLinks.Schedule);
    const toScheduleBuilder = (id: string) => navigate(`${RouterLinks.ScheduleBuilder}/${id}`);
    const toScheduleFood = (id: string, childId: string) => navigate(getScheduleFoodUrl(id, childId));
    const toScheduleEvent = (id: string, childId: string) => navigate(getScheduleEventUrl(id, childId));
    const toLoadData = () => navigate(RouterLinks.LoadData);
    const toDishes = () => navigate(RouterLinks.Dishes);
    const toUserProduct = (id: string) => navigate(`${RouterLinks.UserProduct}/${id}`);
    const toTest = () => navigate(RouterLinks.Test2);

    return {
        navigate,
        location,
        goBack,
        toRoot,
        toDailyNorms,
        toDailyNorm,
        toDishBuilder,
        toDish,
        toDishFoodDraft,
        toDishFood,
        toSchedule,
        toScheduleBuilder,
        toScheduleFood,
        toScheduleEvent,
        toLoadData,
        toDishes,
        toUserProduct,
        toTest,
    };
};

import { useNavigate, useLocation } from 'react-router';
import { RouterLinks, RouterUrls, getScheduleFoodUrl, getScheduleEventUrl, getDishFoodDraftUrl } from '@/router';

export interface UseAppRoutesOptions {
    fallbackUrl?: string;
}

export interface UseAppRoutesReturn {
    navigate: ReturnType<typeof useNavigate>;
    location: ReturnType<typeof useLocation>;
    goBack: (fallback?: string) => void;
    toRoot: () => void;
    toDailyNorms: () => void;
    toDailyNorm: (id: string) => void;
    toDishBuilder: () => void;
    toDish: (id: string) => void;
    toDishFoodDraft: (id: string) => void;
    toDishFood: (id: string, childId: string) => void;
    toSchedule: () => void;
    toScheduleBuilder: (id: string) => void;
    toScheduleFood: (id: string, childId: string) => void;
    toScheduleEvent: (id: string, childId: string) => void;
    toLoadData: () => void;
    toDishes: () => void;
    toProducts: () => void;
    toUserProduct: (id: string) => void;
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
    const toProducts = () => navigate(RouterLinks.Products);
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
        toProducts,
        toUserProduct,
        toTest,
    };
};

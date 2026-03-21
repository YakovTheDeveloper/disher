import { useNavigate, useLocation } from 'react-router';
import { RouterLinks, RouterUrls, getScheduleAnalyticsUrl, getProductUrl } from '@/app/router';

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
    toDish: (id: string) => void;
    toSchedule: () => void;
    toScheduleBuilder: (id: string) => void;
    toScheduleAnalytics: (id: string) => void;
    toFood: () => void;
    toProduct: (id: string) => void;
    toTest: () => void;
}

export const useAppRoutes = (options?: UseAppRoutesOptions): UseAppRoutesReturn => {
    const navigate = useNavigate();
    const location = useLocation();
    const fallbackUrl = options?.fallbackUrl ?? RouterLinks.Root;

    const goBack = (fallback?: string) => {
        const targetUrl = fallback ?? fallbackUrl;

        if (location.key === 'default') {
            navigate(targetUrl, { replace: true });
        } else {
            navigate(-1);
        }
    };

    const toRoot = () => navigate(RouterLinks.Root);
    const toDailyNorms = () => navigate(RouterLinks.DailyNorms);
    const toDailyNorm = (id: string) => navigate(`${RouterLinks.DailyNorms}/${id}`);
    const toDish = (id: string) => navigate(RouterUrls.getDish(id));
    const toScheduleDateSelection = () => navigate(RouterLinks.ScheduleDateSelection);
    const toScheduleBuilder = (id: string) => navigate(`${RouterLinks.ScheduleBuilder}/${id}`);
    const toScheduleAnalytics = (id: string) => navigate(getScheduleAnalyticsUrl(id));
    const toFood = () => navigate(RouterLinks.Food);
    const toProduct = (id: string) => navigate(getProductUrl(id));
    const toTest = () => navigate(RouterLinks.Root);

    return {
        navigate,
        location,
        goBack,
        toRoot,
        toDailyNorms,
        toDailyNorm,
        toDish,
        toSchedule: toScheduleDateSelection,
        toScheduleBuilder,
        toScheduleAnalytics,
        toFood,
        toProduct,
        toTest,
    };
};

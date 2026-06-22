import { useNavigate, useLocation } from 'react-router';
import { RouterLinks, RouterUrls } from '@/app/router';

export interface UseAppRoutesOptions {
    fallbackUrl?: string;
}

export interface UseAppRoutesReturn {
    navigate: ReturnType<typeof useNavigate>;
    location: ReturnType<typeof useLocation>;
    goBack: (fallback?: string) => void;
    toRoot: () => void;
    toDish: (id: string) => void;
    toScheduleBuilder: (id: string) => void;
    toFood: () => void;
}

export const useAppRoutes = (options?: UseAppRoutesOptions): UseAppRoutesReturn => {
    const navigate = useNavigate();
    const location = useLocation();
    const fallbackUrl = options?.fallbackUrl ?? RouterLinks.Root;

    const goBack = (fallback?: string) => {
        const targetUrl = fallback ?? fallbackUrl;

        if (location.key === 'default') {
            navigate(targetUrl, { replace: true, viewTransition: true });
        } else {
            navigate(-1);
        }
    };

    const toRoot = () => navigate(RouterLinks.Root);
    const toDish = (id: string) => navigate(RouterUrls.getDish(id));
    const toScheduleBuilder = (id: string) => navigate(`${RouterLinks.ScheduleBuilder}/${id}`, { viewTransition: true });
    const toFood = () => navigate(RouterLinks.Food);

    return {
        navigate,
        location,
        goBack,
        toRoot,
        toDish,
        toScheduleBuilder,
        toFood,
    };
};

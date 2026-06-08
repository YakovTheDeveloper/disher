import {
    defaultDailyNorms,
    nutrientsHaveDailyNorm,
    Nutrient,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useUserNormItems } from '@/entities/daily-norm';

export interface UseNutrientCardProps {
    content: Nutrient;
    getValue: (id: string) => number;
}

export interface UseNutrientCardReturn {
    displayNameRu: string;
    id: string;
    unitRu: string;
    value: number;
    norm: number;
    percent: number;
    symbol: string;
    progressPercent: number;
    percentText: string;
    statusClass: string;
    /** Есть ли у нутриента официальная суточная норма (`nutrientsHaveDailyNorm`).
     *  false → сахар/крахмал/β-каротин/α-каротин: показываем только значение, без %
     *  (в `defaultDailyNorms` у них лежат плейсхолдеры, но нормы как таковой нет). */
    hasNorm: boolean;
}

const getRoundedPercent = (percentage: number) => {
    if (percentage < 1 && percentage > 0) {
        return percentage.toFixed(2);
    } else if (percentage < 10) {
        return percentage.toFixed(1);
    } else {
        return Math.round(percentage).toString();
    }
};

const getStatusClass = (p: number) => {
    if (p < 30) return 'low';
    if (p < 60) return 'medium';
    if (p <= 99) return 'optimal';
    return 'excess';
};

export const useNutrientCard = ({
    content,
    getValue,
}: UseNutrientCardProps): UseNutrientCardReturn => {
    const { displayNameRu, id, unitRu, symbol } = content;
    const value = getValue(id);
    const userItems = useUserNormItems();
    const userNorm = userItems?.[id];
    const norm = userNorm ?? defaultDailyNorms[+id];
    const hasNorm = nutrientsHaveDailyNorm[+id] === true;

    const percent = norm > 0 ? (value / norm) * 100 : 0;
    const progressPercent = Math.min(100, percent);
    const percentText = getRoundedPercent(percent);
    const statusClass = getStatusClass(percent);

    return {
        displayNameRu,
        id,
        unitRu,
        value,
        norm,
        percent,
        progressPercent,
        percentText,
        statusClass,
        symbol,
        hasNorm,
    };
};

import { QuietActionButton } from '@/shared/ui/atoms/Button/QuietActionButton';

// Sparkle — affordance-иконка «предложить» (semantic suggest). Наследует
// currentColor → красится цветом текста кнопки (приглушённым), оставляя лёгкий
// «magic»-намёк без акцента.
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5l1.6 4.9a4 4 0 0 0 2.5 2.5l4.9 1.6-4.9 1.6a4 4 0 0 0-2.5 2.5L12 20.5l-1.6-4.9a4 4 0 0 0-2.5-2.5L3 11.5l4.9-1.6a4 4 0 0 0 2.5-2.5L12 2.5z" />
  </svg>
);

type Props = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

/**
 * Семантическая обёртка над `QuietActionButton`: тихая текст-кнопка-«предложка»
 * (sparkle слева + label). Кладётся в `Screen.headerAction`. Переиспользуется:
 * DishPage «Предложить ингредиенты», ProductPage «Предложить нутриенты».
 */
export const SuggestActionButton = ({ label, onClick, disabled }: Props) => (
  <QuietActionButton
    label={label}
    icon={<SparkleIcon />}
    iconPosition="start"
    chevron
    onClick={onClick}
    disabled={disabled}
  />
);

export default SuggestActionButton;

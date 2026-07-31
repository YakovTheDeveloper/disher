import { useTranslation } from 'react-i18next';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { type BaseModalProps } from '@/shared/ui';
import { Text } from '@/shared/ui/atoms/Typography';
import { nutrientRowName } from '@/entities/nutrient/ui/NutrientGroup/constants';
import type { Suggestion } from '@/shared/lib/suggest';
// CTA «норма не задана» — готовый чип из dailyNorms (сам открывает DailyNormModal).
// Кросс-слайсный импорт — через @x public API (steiger, fsd/forbidden-imports).
import { NormLegendButton } from '@/features/dailyNorms/@x/food/food-suggest';import { useSuggestions, addSuggestionToSchedule, type SuggestSelectPayload } from '../model';
import NutrientSuggestionFoodCard from './NutrientSuggestionFoodCard';
import s from './SuggestFood.module.scss';

interface SuggestFoodProps extends BaseModalProps {
  /** День расписания (YYYY-MM-DD) — дефициты считаются по его позициям. */
  date: string;
  /**
   * Хостовый обработчик выбора (шаг 5 плана может провести выбор через полный
   * food-entry-флоу). Без него — прямое добавление в рацион реалистичной
   * порцией (addSuggestionToSchedule).
   */
  onSelectFood?: (payload: SuggestSelectPayload) => void;
}

/**
 * Модалка «Что доесть?» — предложка еды по дефицитам дня (шаг 4 плана
 * tds/task_spec/ЧтоЕщеСъесть.md). Host-класс публикует ту же рельсу --rail-*,
 * что SearchFood, — ряды FoodListRow встают на общую вертикаль с заголовком.
 */
const SuggestFood = ({ onClose, date, onSelectFood }: SuggestFoodProps) => {
  const { t } = useTranslation();
  const { suggestions, normComplete, topDeficits, blacklistSize, hasUserNorm, isLoading } =
    useSuggestions(date);

  const title = t('suggest.title', 'Что доесть?');

  const handleSelect = (suggestion: Suggestion) => {
    if (onSelectFood) {
      onSelectFood({
        variant: suggestion.ref.kind,
        id: suggestion.ref.id,
        name: suggestion.ref.name,
        portionGrams: suggestion.portionGrams,
      });
    } else {
      addSuggestionToSchedule(date, suggestion);
    }
    onClose();
  };

  // Подзаголовок — топ-дефициты дня (по относительной величине).
  const deficitNames = topDeficits
    .map((d) => nutrientRowName(d.id).name.toLowerCase())
    .join(', ');

  return (
    <ModalLayout a11yLabel={title}>
      <ModalShell className={s.railHost}>
        <ModalShell.Header title={title} onBack={onClose} />
        <ModalShell.Body>
          <div className={s.content}>
            {!isLoading && !normComplete && deficitNames.length > 0 && (
              <Text as="p" role="caption" className={s.subtitle}>
                {t('suggest.subtitle', 'Главные дефициты дня: {{names}}', {
                  names: deficitNames,
                })}
              </Text>
            )}

            {/* Норма не задана: CTA на мастер-опросник, но список всё равно
                считается по дефолтным нормам (план, шаг 4). */}
            {!isLoading && !hasUserNorm && (
              <div className={s.normCta}>
                <Text as="p" role="caption" className={s.normCtaText}>
                  {t(
                    'suggest.noNormHint',
                    'Норма не задана — подбор идёт по усреднённым значениям. Задайте свою, чтобы предложки были точнее.',
                  )}
                </Text>
                <NormLegendButton />
              </div>
            )}

            {isLoading ? (
              <Text as="p" role="caption" className={s.empty}>
                {t('suggest.loading', 'Загрузка…')}
              </Text>
            ) : normComplete ? (
              <Text as="p" role="body" className={s.empty}>
                {t('suggest.normComplete', 'Норма дня выполнена — дефицитов нет.')}
              </Text>
            ) : suggestions.length === 0 ? (
              <div className={s.empty}>
                <Text as="p" role="body">
                  {t('suggest.empty', 'Не из чего предложить.')}
                </Text>
                {blacklistSize > 0 && (
                  <Text as="p" role="caption" className={s.emptyHint}>
                    {t(
                      'suggest.emptyBlacklisted',
                      'Часть продуктов скрыта вами — списком «Не предлагать» можно управлять в профиле.',
                    )}
                  </Text>
                )}
              </div>
            ) : (
              <ul className={s.list} role="listbox" aria-label={title}>
                {suggestions.map((suggestion) => (
                  <NutrientSuggestionFoodCard
                    key={suggestion.ref.id}
                    suggestion={suggestion}
                    onSelect={() => handleSelect(suggestion)}
                  />
                ))}
              </ul>
            )}
          </div>
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default SuggestFood;

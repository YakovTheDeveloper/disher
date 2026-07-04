import { memo } from 'react';
import AnalysisCard from './AnalysisCard';
import CardSaveButton from './CardSaveButton';
import CardEditChevron from './CardEditChevron';

// HypothesisCard — ветка AnalysisCard для гипотезы: title + тело + тихая мета.
// Ни valence, ни силы, ни evidence (гипотеза их не несёт).
//   • variant='not-added' — в результате разбора: caption «проверить ~N дн.» +
//     кнопка «Сохранить».
//   • variant='added'     — сохранённая гипотеза (/analyses): относительная дата
//     слева + шеврон-правка справа в нижнем ряду.
export const EDIT_HYPOTHESIS_ARIA = 'Редактировать гипотезу';

type Props = {
  title: string;
  body?: string;
  variant: 'added' | 'not-added';
  /** variant='not-added': подсказка «проверить ~N дн.» + сохранение. */
  suggestedDays?: number;
  onAdd?: () => Promise<void>;
  /** variant='added': относительная дата создания (footer слева). */
  meta?: string;
  /** «Только что создан» — эфемерное кольцо. */
  isNew?: boolean;
  /** variant='added': открыть правку. */
  onEdit?: () => void;
  editInputHtmlFor?: string;
};

const HypothesisCard = ({
  title,
  body,
  variant,
  suggestedDays,
  onAdd,
  meta,
  isNew = false,
  onEdit,
  editInputHtmlFor,
}: Props) => {
  const added = variant === 'added';

  const footerRight = added
    ? onEdit && editInputHtmlFor && (
        <CardEditChevron
          onEdit={onEdit}
          editInputHtmlFor={editInputHtmlFor}
          ariaLabel={EDIT_HYPOTHESIS_ARIA}
        />
      )
    : onAdd && (
        <CardSaveButton
          onAdd={onAdd}
          addedAriaLabel="Гипотеза сохранена"
          successToast="Гипотеза сохранена"
          errorToast="Не удалось добавить гипотезу"
        />
      );

  return (
    <AnalysisCard
      title={title}
      detail={body}
      caption={!added && suggestedDays ? `проверить ~${suggestedDays} дн.` : undefined}
      footerLeft={added ? meta || undefined : undefined}
      footerRight={footerRight || undefined}
      isNew={isNew}
    />
  );
};

export default memo(HypothesisCard);

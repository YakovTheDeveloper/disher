import { useEffect, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { FoodHintButton } from '@/shared/ui/FoodHintButton';
import { CHANGE_DESCRIPTION_INPUT_ID } from './constants';

type Props = {
  currentDescription: string;
  isExpanded: boolean;
  onClose: () => void;
  onChangeDescription: (next: string) => void;
  /** Показать кнопку-подсказку ⓘ (про состав БАД) в шапке. Продукт → да, блюдо →
   *  нет (блюдо не может быть БАД). Дефолт true. */
  showHint?: boolean;
};

// Сестра ChangeNameModal для необязательного описания. Отличия от имени: поле
// мультилайн (без singleLine) и ПУСТОЕ значение валидно — сохранение пустой
// строки стирает описание (у имени пусто = no-op, имя не может быть пустым).
const ChangeDescriptionModal = ({
  currentDescription,
  isExpanded,
  onClose,
  onChangeDescription,
  showHint = true,
}: Props) => {
  const [value, setValue] = useState(currentDescription);

  useEffect(() => {
    if (isExpanded) {
      setValue(currentDescription);
    }
  }, [isExpanded, currentDescription]);

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        const el = document.getElementById(CHANGE_DESCRIPTION_INPUT_ID);
        el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleSave = () => {
    const trimmed = value.trim();
    // Пусто разрешено: trimmed='' при непустом currentDescription = стирание.
    if (trimmed !== currentDescription) {
      onChangeDescription(trimmed);
    } else {
      onClose();
    }
  };

  return (
    <ModalByLabel
      position="absolute"
      isExpanded={isExpanded}
      content={
        <ModalShell variant="spring2">
          <ModalShell.Header
            title="Изменить описание"
            onBack={onClose}
            trailing={showHint ? <FoodHintButton /> : undefined}
          />
          <ModalShell.Body>
            <AutoGrowSearch
              id={CHANGE_DESCRIPTION_INPUT_ID}
              value={value}
              onChange={setValue}
              placeholder="Подробности (необяз.)"
              maxLength={2000}
              autoFocus={isExpanded}
            />
            {isExpanded && (
              <ModalShell.ActionButtons
                debugId="change-description"
                right={<ModalNextButton onClick={handleSave} variant="finish" />}
              />
            )}
          </ModalShell.Body>
        </ModalShell>
      }
    />
  );
};

export default ChangeDescriptionModal;

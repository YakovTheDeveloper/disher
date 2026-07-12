import { useEffect, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { HeaderDeleteButton } from '@/shared/ui/ModalHeader';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { CHANGE_NAME_INPUT_ID } from './constants';

type Props = {
  currentName: string;
  isExpanded: boolean;
  onClose: () => void;
  onChangeName: (newName: string) => void;
  /** Опционально: удаление сущности → серая урна в правом слоте шапки.
   *  Подтверждение (ConfirmModal), мутация и уход с экрана — на стороне caller'а. */
  onDelete?: () => void;
  /** a11y-метка урны, напр. «Удалить блюдо». */
  deleteLabel?: string;
};

const ChangeNameModal = ({
  currentName,
  isExpanded,
  onClose,
  onChangeName,
  onDelete,
  deleteLabel,
}: Props) => {
  const [value, setValue] = useState(currentName);

  useEffect(() => {
    if (isExpanded) {
      setValue(currentName);
    }
  }, [isExpanded, currentName]);

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        const el = document.getElementById(CHANGE_NAME_INPUT_ID);
        el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== currentName) {
      onChangeName(trimmed);
    } else if (trimmed === currentName) {
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
            title="Изменить название"
            onBack={onClose}
            trailing={
              onDelete ? (
                <HeaderDeleteButton onClick={onDelete} label={deleteLabel} />
              ) : undefined
            }
          />
          <ModalShell.Body>
            <AutoGrowSearch
              singleLine
              id={CHANGE_NAME_INPUT_ID}
              value={value}
              onChange={setValue}
              placeholder={currentName}
              maxLength={500}
              autoFocus={isExpanded}
            />
            {isExpanded && (
              <ModalShell.ActionButtons
                debugId="change-name"
                right={<ModalNextButton onClick={handleSave} variant="finish" />}
              />
            )}
          </ModalShell.Body>
        </ModalShell>
      }
    />
  );
};

export default ChangeNameModal;

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { saveHypothesis } from '@/entities/hypothesis';
import styles from './CreateHypothesisModal.module.scss';

// The label-driven trigger focuses this input id; `onFocusCapture` in the
// parent flips the step to 'create' and the ModalByLabel expands.
export const CREATE_HYPOTHESIS_TITLE_INPUT_ID = 'create-hypothesis-title';

type Props = {
  isExpanded: boolean;
  onClose: () => void;
};

const CreateHypothesisModal = ({ isExpanded, onClose }: Props) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setTitle('');
      setBody('');
      setSubmitting(false);
    }
  }, [isExpanded]);

  // iOS: после раскрытия и появления виртуальной клавиатуры подтянуть title
  // в центр viewport. Без этого ModalShell hero/orbs могут оттеснить инпут
  // вплотную к клавиатуре. Паттерн из ChangeNameModal.
  useEffect(() => {
    if (!isExpanded) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(CREATE_HYPOTHESIS_TITLE_INPUT_ID);
      el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
    }, 300);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const canSubmit = title.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await saveHypothesis({ title: title.trim(), body: body.trim() });
      toast.success('Гипотеза добавлена');
      onClose();
    } catch (err) {
      console.error('saveHypothesis failed', err);
      toast.error('Не удалось сохранить гипотезу');
      setSubmitting(false);
    }
  }

  return (
    <ModalByLabel
      position="absolute"
      isExpanded={isExpanded}
      content={
        <ModalShell variant="spring4">
          <ModalShell.Header title="Новая гипотеза" onBack={onClose} />
          <ModalShell.Body>
            <div className={styles.fields}>
              <AutoGrowSearch
                singleLine
                id={CREATE_HYPOTHESIS_TITLE_INPUT_ID}
                value={title}
                onChange={setTitle}
                placeholder="Коротко — что проверяем"
                maxLength={500}
              />
              <AutoGrowSearch
                value={body}
                onChange={setBody}
                placeholder="Подробнее (необязательно): что отслеживаем, при каких условиях…"
                maxRows={10}
                collapseOnBlur={false}
              />
              {body.length > 0 && (
                <span
                  className={
                    body.length > 5000
                      ? `${styles.counter} ${styles.counterOver}`
                      : styles.counter
                  }
                >
                  {body.length}
                </span>
              )}
            </div>
            {isExpanded && (
              <ModalShell.ActionButtons
                debugId="create-hypothesis"
                right={
                  <ModalNextButton
                    onClick={handleSubmit}
                    variant="finish"
                    label="Сохранить"
                    disabled={!canSubmit}
                  />
                }
              />
            )}
          </ModalShell.Body>
        </ModalShell>
      }
    />
  );
};

export default CreateHypothesisModal;

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { modalStore } from '@/shared/ui';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import {
  useHypothesis,
  updateHypothesis,
  deleteHypothesis,
} from '@/entities/hypothesis';
import styles from './HypothesisModal.module.scss';
import editStyles from './EditHypothesisModal.module.scss';

// Каждая строка в HypothesisListPanel — это <label htmlFor={EDIT_…}> с
// onClick, который записывает в parent editingId. focus → onFocusCapture в
// родителе → setEditStep('edit'). Один input id на весь список — модалка
// одна, просто меняет hypothesisId.
export const EDIT_HYPOTHESIS_TITLE_INPUT_ID = 'edit-hypothesis-title';
const EDIT_HYPOTHESIS_BODY_INPUT_ID = 'edit-hypothesis-body';

type Props = {
  hypothesisId: string | null;
  isExpanded: boolean;
  onClose: () => void;
};

const EditHypothesisModal = ({ hypothesisId, isExpanded, onClose }: Props) => {
  const hypothesis = useHypothesis(hypothesisId ?? undefined);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  // Re-seed состояние, когда открыли модалку или сменили editingId на лету.
  // Без проверки `hypothesis` пустой prefill съест уже введённые правки на
  // одном тике, пока useLiveQuery не вернул строку.
  useEffect(() => {
    if (!isExpanded || !hypothesis) return;
    setTitle(hypothesis.title);
    setBody(hypothesis.body);
    setBusy(false);
  }, [isExpanded, hypothesis]);

  // iOS scrollIntoView — подтянуть title в центр viewport после раскрытия.
  useEffect(() => {
    if (!isExpanded) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(EDIT_HYPOTHESIS_TITLE_INPUT_ID);
      el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
    }, 300);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const canSave = title.trim().length > 0 && !busy && hypothesis !== null;

  async function handleSave() {
    if (!canSave || !hypothesis) return;
    setBusy(true);
    try {
      await updateHypothesis(hypothesis.id, {
        title: title.trim(),
        body: body.trim(),
      });
      onClose();
    } catch (err) {
      console.error('updateHypothesis failed', err);
      toast.error('Не удалось сохранить');
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy || !hypothesis) return;
    const confirmed = await modalStore.show(ConfirmModal, {
      title: 'Удалить гипотезу?',
      message:
        'Гипотеза исчезнет из списка. Уже сделанные разборы сохранят её копию.',
      confirmLabel: 'Удалить',
      tone: 'danger',
    });
    if (confirmed !== true) return;
    setBusy(true);
    try {
      await deleteHypothesis(hypothesis.id);
      onClose();
    } catch (err) {
      console.error('deleteHypothesis failed', err);
      toast.error('Не удалось удалить');
      setBusy(false);
    }
  }

  return (
    <ModalByLabel
      position="absolute"
      isExpanded={isExpanded}
      content={
        <ModalShell variant="spring4">
          <ModalShell.Header title="Гипотеза" onBack={onClose} />
          <ModalShell.Body>
            <div className={styles.fields}>
              {/* Видимые лейблы — без них непонятно, где название, где описание
                  (просьба 2026-06-13). htmlFor связывает с инпутом AutoGrowSearch. */}
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}>
                  Название
                </label>
                <AutoGrowSearch
                  singleLine
                  id={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
                  value={title}
                  onChange={setTitle}
                  placeholder="Коротко — что проверяем"
                  maxLength={500}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={EDIT_HYPOTHESIS_BODY_INPUT_ID}>
                  Описание <span className={styles.fieldLabelHint}>· необязательно</span>
                </label>
                <AutoGrowSearch
                  id={EDIT_HYPOTHESIS_BODY_INPUT_ID}
                  value={body}
                  onChange={setBody}
                  placeholder="Что отслеживаем, при каких условиях…"
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
            </div>
            {isExpanded && (
              <ModalShell.ActionButtons
                debugId="edit-hypothesis"
                left={
                  <button
                    type="button"
                    className={editStyles.delete}
                    disabled={busy || !hypothesis}
                    onClick={handleDelete}
                  >
                    Удалить
                  </button>
                }
                right={
                  <ModalNextButton
                    onClick={handleSave}
                    variant="finish"
                    label="Сохранить"
                    disabled={!canSave}
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

export default EditHypothesisModal;

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { HeaderDeleteButton } from '@/shared/ui/ModalHeader';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { modalStore } from '@/shared/ui';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { FieldLabel } from '@/shared/ui/atoms/Typography/FieldLabel';
import {
  useHypothesis,
  updateHypothesis,
  deleteHypothesis,
} from '@/entities/hypothesis';
import styles from './HypothesisModal.module.scss';
// Каждая строка в HypothesisListPanel — это <label htmlFor={EDIT_…}> с
// onClick, который записывает в parent editingId. focus → onFocusCapture в
// родителе → setEditStep('edit'). Один input id на весь список — модалка
// одна, просто меняет hypothesisId. Const вынесен в отдельный файл, чтобы этот
// модуль остался «только компонент» (Fast Refresh).
import { EDIT_HYPOTHESIS_TITLE_INPUT_ID } from './editHypothesisModal.constants';

const EDIT_HYPOTHESIS_BODY_INPUT_ID = 'edit-hypothesis-body';

type Props = {
  hypothesisId: string | null;
  isExpanded: boolean;
  onClose: () => void;
  /** Portal target for the overlay — a node inside the host modal popup so it
   *  joins that popup's stacking context (see ModalByLabel.container). Falls
   *  back to `#modal-by-label-root` when omitted. */
  overlayContainer?: HTMLElement | null;
};

const EditHypothesisModal = ({
  hypothesisId,
  isExpanded,
  onClose,
  overlayContainer,
}: Props) => {
  const hypothesis = useHypothesis(hypothesisId ?? undefined);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  // Hosted inside the «Гипотезы» modal: register as top-of-stack so hardware/
  // browser Back closes THIS overlay (not the host modal, which would drop the edit).
  useOverlayHistory(isExpanded, onClose);

  // Re-seed при открытии или смене editingId — но РОВНО ОДИН раз на пару
  // (open, hypothesisId). `hypothesis` приходит из useLiveQuery(db.hypotheses.get)
  // и пере-эмитит новый объект на ЛЮБУЮ запись в таблицу (фоновый merge() со
  // второго устройства, правка другой гипотезы) — без гарда это затирало бы уже
  // введённый текст на каждый такой re-emit. seededRef запоминает id, для
  // которого поля уже засеяны; сбрасывается на закрытии → следующее открытие (или
  // смена editingId на лету) сеет заново. Без проверки `hypothesis` пустой
  // prefill съест правки на тике, пока useLiveQuery не вернул строку.
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isExpanded) {
      seededRef.current = null;
      return;
    }
    if (!hypothesis || seededRef.current === hypothesis.id) return;
    seededRef.current = hypothesis.id;
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
      container={overlayContainer}
      isExpanded={isExpanded}
      content={
        <ModalShell variant="spring4">
          <ModalShell.Header
            title="Гипотеза"
            onBack={onClose}
            // «Удалить» — деструктив, живёт в правом верхнем углу обвязки
            // (канон ItemActionsDrawer), подальше от «Сохранить» в футере.
            trailing={
              <HeaderDeleteButton
                onClick={handleDelete}
                disabled={busy || !hypothesis}
                label="Удалить гипотезу"
              />
            }
          />
          <ModalShell.Body inset>
            <div className={styles.fields}>
              {/* Видимые лейблы — без них непонятно, где название, где описание
                  (просьба 2026-06-13). htmlFor связывает с инпутом AutoGrowSearch. */}
              <div className={styles.field}>
                <FieldLabel className={styles.labelInset} htmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}>
                  Название
                </FieldLabel>
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
                <FieldLabel
                  className={styles.labelInset}
                  htmlFor={EDIT_HYPOTHESIS_BODY_INPUT_ID}
                  hint="· необязательно"
                >
                  Описание
                </FieldLabel>
                <AutoGrowSearch
                  id={EDIT_HYPOTHESIS_BODY_INPUT_ID}
                  value={body}
                  onChange={setBody}
                  placeholder="Что отслеживаем, при каких условиях…"
                  maxRows={10}
                  collapseOnBlur={false}
                />
              </div>
            </div>
            {isExpanded && (
              <ModalShell.ActionButtons
                debugId="edit-hypothesis"
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

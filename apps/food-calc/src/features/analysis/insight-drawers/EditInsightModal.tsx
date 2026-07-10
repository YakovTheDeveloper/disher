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
import { useInsight, updateInsight, deleteInsight } from '@/entities/insight';
import styles from './InsightModal.module.scss';
// Каждая строка в InsightListPanel — это <label htmlFor={EDIT_…}> с onClick,
// который записывает в parent editingId. focus → onFocusCapture в родителе →
// setEditStep('edit'). Один input id на весь список — модалка одна, просто меняет
// insightId. Const в отдельном файле, чтобы модуль остался «только компонент»
// (Fast Refresh). Зеркало EditHypothesisModal — только title/detail редактируемы
// (valence/strength/evidence классифицирует LLM).
import { EDIT_INSIGHT_TITLE_INPUT_ID } from './editInsightModal.constants';

const EDIT_INSIGHT_DETAIL_INPUT_ID = 'edit-insight-detail';

type Props = {
  insightId: string | null;
  isExpanded: boolean;
  onClose: () => void;
  /** Portal target for the overlay — a node inside the host modal popup so it
   *  joins that popup's stacking context. Falls back to `#modal-by-label-root`. */
  overlayContainer?: HTMLElement | null;
};

const EditInsightModal = ({ insightId, isExpanded, onClose, overlayContainer }: Props) => {
  const insight = useInsight(insightId ?? undefined);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);

  // Register as top-of-stack so hardware/browser Back closes THIS overlay.
  useOverlayHistory(isExpanded, onClose);

  // Re-seed при открытии или смене editingId — но РОВНО ОДИН раз на пару
  // (open, insightId). `insight` приходит из useLiveQuery(db.insights.get) и
  // пере-эмитит новый объект на ЛЮБУЮ запись в таблицу (фоновый merge() со
  // второго устройства, правка другого инсайта) — без гарда это затирало бы уже
  // введённый текст на каждый такой re-emit. seededRef запоминает id, для
  // которого поля уже засеяны; сбрасывается на закрытии → следующее открытие (или
  // смена editingId на лету) сеет заново. Без проверки `insight` пустой prefill
  // съест правки на тике, пока useLiveQuery не вернул строку.
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isExpanded) {
      seededRef.current = null;
      return;
    }
    if (!insight || seededRef.current === insight.id) return;
    seededRef.current = insight.id;
    setTitle(insight.title);
    setDetail(insight.detail);
    setBusy(false);
  }, [isExpanded, insight]);

  // iOS scrollIntoView — подтянуть title в центр viewport после раскрытия.
  useEffect(() => {
    if (!isExpanded) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(EDIT_INSIGHT_TITLE_INPUT_ID);
      el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
    }, 300);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const canSave = title.trim().length > 0 && !busy && insight !== null;

  async function handleSave() {
    if (!canSave || !insight) return;
    setBusy(true);
    try {
      await updateInsight(insight.id, { title: title.trim(), detail: detail.trim() });
      onClose();
    } catch (err) {
      console.error('updateInsight failed', err);
      toast.error('Не удалось сохранить');
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy || !insight) return;
    const confirmed = await modalStore.show(ConfirmModal, {
      title: 'Удалить инсайт?',
      message: 'Инсайт исчезнет из списка наблюдений.',
      confirmLabel: 'Удалить',
      tone: 'danger',
    });
    if (confirmed !== true) return;
    setBusy(true);
    try {
      await deleteInsight(insight.id);
      onClose();
    } catch (err) {
      console.error('deleteInsight failed', err);
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
            title="Инсайт"
            onBack={onClose}
            trailing={
              <HeaderDeleteButton
                onClick={handleDelete}
                disabled={busy || !insight}
                label="Удалить инсайт"
              />
            }
          />
          <ModalShell.Body inset>
            <div className={styles.fields}>
              <div className={styles.field}>
                <FieldLabel className={styles.labelInset} htmlFor={EDIT_INSIGHT_TITLE_INPUT_ID}>
                  Название
                </FieldLabel>
                <AutoGrowSearch
                  singleLine
                  id={EDIT_INSIGHT_TITLE_INPUT_ID}
                  value={title}
                  onChange={setTitle}
                  placeholder="Коротко — что за связка"
                  maxLength={500}
                />
              </div>

              <div className={styles.field}>
                <FieldLabel
                  className={styles.labelInset}
                  htmlFor={EDIT_INSIGHT_DETAIL_INPUT_ID}
                  hint="· необязательно"
                >
                  Описание
                </FieldLabel>
                <AutoGrowSearch
                  id={EDIT_INSIGHT_DETAIL_INPUT_ID}
                  value={detail}
                  onChange={setDetail}
                  placeholder="Что заметили и при каких условиях…"
                  maxRows={10}
                  collapseOnBlur={false}
                />
              </div>
            </div>
            {isExpanded && (
              <ModalShell.ActionButtons
                debugId="edit-insight"
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

export default EditInsightModal;

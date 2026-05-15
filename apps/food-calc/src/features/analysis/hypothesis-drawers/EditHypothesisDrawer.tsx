import { memo, useState } from 'react';
import { toast } from 'sonner';
import type { BaseDrawerProps } from '@/shared/ui';
import { drawerStore, modalStore } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import {
  useHypothesis,
  updateHypothesis,
  deleteHypothesis,
  type Hypothesis,
} from '@/entities/hypothesis';
import styles from './HypothesisDrawer.module.scss';

type Props = BaseDrawerProps<void> & {
  hypothesisId: string;
};

// Inner form — mounted only once the hypothesis row has loaded, so the
// initial title/body seed local state exactly once (no useEffect re-seed).
const EditForm = ({
  hypothesis,
  onClose,
}: {
  hypothesis: Hypothesis;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState(hypothesis.title);
  const [body, setBody] = useState(hypothesis.body);
  const [busy, setBusy] = useState(false);

  const canSave = title.trim().length > 0 && !busy;

  async function handleSave() {
    if (!canSave) return;
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
    if (busy) return;
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
    <div className={styles.form}>
      <h2 className={styles.heading}>Гипотеза</h2>

      <div className={styles.field}>
        <span className={styles.label}>Коротко — что проверяем</span>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-base-ui-swipe-ignore
          autoComplete="off"
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Подробнее (необязательно)</span>
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          data-base-ui-swipe-ignore
        />
        <span
          className={
            body.length > 5000
              ? `${styles.counter} ${styles.counterOver}`
              : styles.counter
          }
        >
          {body.length}
        </span>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.submit}
          disabled={!canSave}
          onClick={handleSave}
        >
          Сохранить
        </button>
        <button
          type="button"
          className={styles.delete}
          disabled={busy}
          onClick={handleDelete}
        >
          Удалить гипотезу
        </button>
      </div>
    </div>
  );
};

const EditHypothesisDrawer = ({ hypothesisId, onClose }: Props) => {
  const hypothesis = useHypothesis(hypothesisId);

  return (
    <DrawerLayout a11yLabel="Редактировать гипотезу">
      {hypothesis ? (
        <EditForm hypothesis={hypothesis} onClose={onClose} />
      ) : (
        <p className={styles.loading}>Загрузка…</p>
      )}
    </DrawerLayout>
  );
};

// Convenience opener used by the hypothesis list rows.
export function openEditHypothesisDrawer(hypothesisId: string): void {
  void drawerStore.show(EditHypothesisDrawer, { hypothesisId });
}

export default memo(EditHypothesisDrawer);

import { memo, useState } from 'react';
import { toast } from 'sonner';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading } from '@/shared/ui/atoms/Typography';
import { saveHypothesis } from '@/entities/hypothesis';
import styles from './HypothesisDrawer.module.scss';

// Manual hypothesis creation — a plain title + body form. No AI auto-fill
// (anti-goal): the user writes their own guess. `body` has no hard limit
// (truncation happens later in the LLM payload); the counter is advisory.
type Props = BaseDrawerProps<void>;

const CreateHypothesisDrawer = ({ onClose }: Props) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <DrawerLayout a11yLabel="Новая гипотеза">
      <div className={styles.form}>
        <Heading size="drawer">Новая гипотеза</Heading>

        <div className={styles.field}>
          <span className={styles.label}>Коротко — что проверяем</span>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Напр. «От кофе после обеда хуже сон»"
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
            placeholder="Что именно отслеживаем, при каких условиях…"
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
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Сохранить
          </button>
        </div>
      </div>
    </DrawerLayout>
  );
};

export default memo(CreateHypothesisDrawer);

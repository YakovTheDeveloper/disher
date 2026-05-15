import { memo, useState } from 'react';
import { toast } from 'sonner';
import { saveHypothesis } from '@/entities/hypothesis';
import type { IdeaCardData } from '../api';
import styles from './IdeaCard.module.scss';

type Props = {
  idea: IdeaCardData;
};

// One idea = one card. The single «+ в гипотезы» action saves the idea text
// straight into the hypotheses list (no intermediate form — the text is
// already written; the user can refine it later via the edit drawer).
//
// «✓ добавлено» is per-card local state, NOT persisted: there is no real
// idempotency, so the badge only guards against an obvious double-tap within
// the same render lifetime. A reload resets it — re-adding the same idea
// twice is a deliberate, allowed outcome.
const IdeaCard = ({ idea }: Props) => {
  const [added, setAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (submitting || added) return;
    setSubmitting(true);
    try {
      await saveHypothesis({ title: idea.title, body: idea.body });
      setAdded(true);
      toast.success('Добавлено в гипотезы');
    } catch (err) {
      console.error('saveHypothesis failed', err);
      toast.error('Не удалось добавить');
      setSubmitting(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.text}>
        <h3 className={styles.title}>{idea.title}</h3>
        {idea.body && <p className={styles.body}>{idea.body}</p>}
      </div>
      {added ? (
        <span className={styles.addedBadge}>✓ добавлено</span>
      ) : (
        <button
          type="button"
          className={styles.addButton}
          disabled={submitting}
          onClick={handleAdd}
        >
          + в гипотезы
        </button>
      )}
    </article>
  );
};

export default memo(IdeaCard);

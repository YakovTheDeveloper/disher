import { memo, useState } from 'react';
import { saveHypothesis } from '@/entities/hypothesis';
import type { IdeaCardData } from '../api';
import styles from './IdeaCard.module.scss';

type Props = {
  idea: IdeaCardData;
  /** Analysis row that produced this idea — written to hypothesis.sourceAnalysisId. */
  sourceAnalysisId?: string;
  /** Called after a hypothesis is saved (e.g. to show a transient toast). */
  onAfterSave?: (intent: 'saved' | 'testing') => void;
};

const IdeaCard = ({ idea, sourceAnalysisId, onAfterSave }: Props) => {
  // Local saved-state — buttons collapse into a "✓ saved" / "✓ testing" badge
  // after click. We don't query hypotheses by sourceAnalysisId+title because
  // the same idea can be saved multiple times intentionally (different test
  // periods). One click = one row; the user is in control.
  const [savedAs, setSavedAs] = useState<'saved' | 'testing' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function commit(intent: 'saved' | 'testing') {
    if (submitting || savedAs) return;
    setSubmitting(true);
    try {
      await saveHypothesis({
        title: idea.title,
        body: idea.body,
        ...(idea.days !== undefined ? { days: idea.days } : {}),
        ...(sourceAnalysisId ? { sourceAnalysisId } : {}),
        startNow: intent === 'testing',
      });
      setSavedAs(intent);
      onAfterSave?.(intent);
    } catch (err) {
      console.error('saveHypothesis failed', err);
      setSubmitting(false);
    }
  }

  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{idea.title}</h3>
      {idea.days !== undefined && <p className={styles.meta}>{idea.days} дней</p>}
      <p className={styles.body}>{idea.body}</p>
      <div className={styles.actionRow}>
        {savedAs ? (
          <span className={styles.savedBadge}>
            {savedAs === 'testing' ? '✓ Тестирую' : '✓ Сохранено'}
          </span>
        ) : (
          <>
            <button
              type="button"
              className={styles.outlineButton}
              disabled={submitting}
              onClick={() => commit('saved')}
            >
              Сохранить
            </button>
            <button
              type="button"
              className={styles.runButton}
              disabled={submitting}
              onClick={() => commit('testing')}
            >
              Тестирую
            </button>
          </>
        )}
      </div>
    </article>
  );
};

export default memo(IdeaCard);

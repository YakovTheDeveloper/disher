import { memo, useState } from 'react';
import { toast } from 'sonner';
import { saveHypothesis } from '@/entities/hypothesis';
import PlusIcon from '@/shared/assets/icons/plus.svg?react';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Text } from '@/shared/ui/atoms/Typography';
import type { AnalysisHypothesis } from '../api';
import styles from './HypothesisCard.module.scss';

type Props = {
  hypothesis: AnalysisHypothesis;
};

// One hypothesis = one testable experiment the model proposes. Unlike an
// insight, it IS addable: «Добавить к себе» writes it into the user's Dexie
// hypothesis list (saveHypothesis → putRow), so the next analysis can pick it
// up via appliedHypotheses — closing the «заметил → проверяю» loop.
const HypothesisCard = ({ hypothesis }: Props) => {
  const { title, body, suggestedDays } = hypothesis;
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (added || saving) return;
    setSaving(true);
    try {
      await saveHypothesis({ title, body });
      setAdded(true);
      toast.success('Гипотеза сохранена');
    } catch (err) {
      console.error('save hypothesis failed', err);
      toast.error('Не удалось добавить гипотезу');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.text}>
        <div className={styles.head}>
          <Heading as="h3" role="title" className={styles.cardTitle}>
            {title}
          </Heading>
          {suggestedDays ? (
            <Text as="span" role="caption" className={styles.days}>
              проверить ~{suggestedDays} дн.
            </Text>
          ) : null}
        </div>
        {body && (
          <Text role="body" className={styles.body}>
            {body}
          </Text>
        )}
      </div>
      <button
        type="button"
        className={styles.add}
        onClick={handleAdd}
        disabled={added || saving}
        data-added={added || undefined}
        aria-label={added ? 'Гипотеза сохранена' : 'Сохранить гипотезу'}
      >
        {added ? (
          <Text as="span" role="caption">
            ✓ сохранено
          </Text>
        ) : (
          <>
            <PlusIcon aria-hidden />
            <Text as="span" role="caption">
              Сохранить гипотезу
            </Text>
          </>
        )}
      </button>
    </article>
  );
};

export default memo(HypothesisCard);

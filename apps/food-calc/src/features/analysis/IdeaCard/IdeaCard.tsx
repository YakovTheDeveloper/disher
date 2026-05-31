import { memo } from 'react';
import type { IdeaCardData } from '../api';
import styles from './IdeaCard.module.scss';

type Props = {
  idea: IdeaCardData;
};

// One idea = one display card (title + body). Read-only: ideas are no longer
// converted into hypotheses — manual create now lives in the inline composer
// (HypothesisComposer), so there is no «+ в гипотезы» action here.
const IdeaCard = ({ idea }: Props) => (
  <article className={styles.card}>
    <div className={styles.text}>
      <h3 className={styles.title}>{idea.title}</h3>
      {idea.body && <p className={styles.body}>{idea.body}</p>}
    </div>
  </article>
);

export default memo(IdeaCard);

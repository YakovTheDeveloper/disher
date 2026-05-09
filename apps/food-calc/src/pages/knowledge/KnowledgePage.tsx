import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useClosedHypotheses } from '@/entities/hypothesis';
import styles from './KnowledgePage.module.scss';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'dd.MM.yyyy');
  } catch {
    return '';
  }
}

const KnowledgePage = () => {
  const closed = useClosedHypotheses();

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← Назад</Link>
      <h1 className={styles.title}>Что я знаю про себя</h1>

      {closed.length === 0 ? (
        <p className={styles.empty}>Закрытые гипотезы появятся здесь.</p>
      ) : (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Закрытые гипотезы</h2>
          {closed.map((h) => (
            <div key={h.id} className={styles.row}>
              <div className={styles.rowHeader}>
                <span className={styles.rowName}>{h.title}</span>
                <span className={styles.rowDate}>{formatDate(h.endedAt)}</span>
              </div>
              {h.outcome && <p className={styles.rowConclusion}>{h.outcome}</p>}
              {h.body && <p className={styles.rowMeta}>{h.body}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default KnowledgePage;

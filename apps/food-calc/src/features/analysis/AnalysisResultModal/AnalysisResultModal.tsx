import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { IdeaCard } from '../IdeaCard';
import type { IdeaCardData } from '../api';
import styles from './AnalysisResultModal.module.scss';

type Props = BaseModalProps<void> & {
  /** Analysis row id — propagated to IdeaCard.sourceAnalysisId for traceability. */
  analysisId?: string;
  resultMd: string;
  ideaCards?: IdeaCardData[];
};

const AnalysisResultModal = ({
  analysisId,
  resultMd,
  ideaCards = [],
  onClose,
}: Props) => (
  <ModalLayout className={styles.layout}>
    <header className={styles.header}>
      <h2 className={styles.title}>Разбор данных</h2>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => onClose()}
        aria-label="Закрыть"
      >
        ×
      </button>
    </header>
    <div className={styles.body}>
      <div className={styles.markdown}>
        <ReactMarkdown>{resultMd}</ReactMarkdown>
      </div>
      {ideaCards.length > 0 && (
        <section className={styles.ideasSection}>
          <p className={styles.ideasTitle}>Гипотезы для проверки</p>
          {ideaCards.map((idea, idx) => (
            <IdeaCard
              key={idx}
              idea={idea}
              {...(analysisId ? { sourceAnalysisId: analysisId } : {})}
            />
          ))}
        </section>
      )}
    </div>
  </ModalLayout>
);

export default memo(AnalysisResultModal);

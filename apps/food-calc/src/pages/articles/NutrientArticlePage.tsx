import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { fetchNutrientArticle } from './api';
import s from './NutrientArticlePage.module.scss';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const NutrientArticlePage = () => {
  const { folder } = useParams<'folder'>();
  const { goBack } = useAppRoutes({ fallbackUrl: '/articles/nutrients' });
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folder) return;
    setLoading(true);
    fetchNutrientArticle(folder)
      .then(setContent)
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [folder]);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={() => goBack()} type="button" aria-label="Назад">
          <BackIcon />
        </button>
        <span className={s.headerTitle}>Статья</span>
      </div>

      <div className={s.content}>
        {loading && <div className={s.loading}>Загрузка...</div>}
        {!loading && !content && (
          <div className={s.notFound}>Статья не найдена</div>
        )}
        {!loading && content && (
          <div className={s.prose}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutrientArticlePage;

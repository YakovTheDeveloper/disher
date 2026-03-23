import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { fetchNutrientArticles, fetchNutrientArticle } from './api';
import type { NutrientArticleEntry } from './api';
import s from './NutrientArticlesPage.module.scss';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

interface ArticleWithNutrient extends NutrientArticleEntry {
  nutrient: Nutrient | undefined;
  preview: string | null;
}

const NutrientArticlesPage = () => {
  const { goBack, toNutrientArticle } = useAppRoutes();
  const [articles, setArticles] = useState<ArticleWithNutrient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchNutrientArticles()
      .then((entries) => {
        const enriched = entries.map((entry) => ({
          ...entry,
          nutrient: allNutrientsList.find(
            (n) => n.id === entry.nutrientId || n.name === entry.nutrientName
          ),
          preview: null,
        }));
        setArticles(enriched);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(
    (folder: string) => {
      if (expandedFolder === folder) {
        setExpandedFolder(null);
        return;
      }
      setExpandedFolder(folder);
      if (!previews[folder]) {
        fetchNutrientArticle(folder).then((content) => {
          if (content) {
            // Extract first paragraph as preview (skip h1)
            const lines = content.split('\n').filter((l) => l.trim());
            const firstParagraph = lines.find((l) => !l.startsWith('#') && l.trim().length > 0);
            setPreviews((prev) => ({ ...prev, [folder]: firstParagraph || '' }));
          }
        });
      }
    },
    [expandedFolder, previews]
  );

  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={() => goBack()} type="button" aria-label="Назад">
          <BackIcon />
        </button>
        <span className={s.headerTitle}>Справочник</span>
      </div>

      <div className={s.hero}>
        <h1 className={s.heroTitle}>Нутриенты</h1>
        <p className={s.heroSubtitle}>Справочные статьи о витаминах и минералах</p>
      </div>

      <div className={s.content}>
        {loading && <div className={s.loading}>Загрузка...</div>}
        {!loading && articles.length === 0 && (
          <div className={s.empty}>Статьи пока не добавлены</div>
        )}
        {!loading && articles.length > 0 && (
          <div className={s.list}>
            {articles.map((article) => {
              const isOpen = expandedFolder === article.folder;
              const displayName = article.nutrient?.displayNameRu || article.nutrientName;
              const displayNameEn = article.nutrient?.displayName || '';
              const symbol = article.nutrient?.symbol || '';

              return (
                <div key={article.folder} className={s.item}>
                  <button
                    className={s.itemHeader}
                    onClick={() => handleToggle(article.folder)}
                    type="button"
                  >
                    {symbol && <span className={s.itemSymbol}>{symbol}</span>}
                    <div className={s.itemInfo}>
                      <div className={s.itemName}>{displayName}</div>
                      {displayNameEn && <div className={s.itemNameEn}>{displayNameEn}</div>}
                    </div>
                    <div className={clsx(s.itemChevron, isOpen && s.itemChevronOpen)}>
                      <ChevronIcon />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        className={s.itemBody}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <div className={s.itemPreview}>
                          {previews[article.folder] && (
                            <p className={s.previewText}>{previews[article.folder]}</p>
                          )}
                          <button
                            className={s.readMore}
                            onClick={() => toNutrientArticle(article.folder)}
                            type="button"
                          >
                            Читать статью →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NutrientArticlesPage;

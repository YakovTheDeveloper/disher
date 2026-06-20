import type { ComponentType } from 'react';
import { Link, type RouteObject } from 'react-router-dom';

import DevShell from './DevShell';
import s from './SuggestionLayout.module.scss';

// Каждая «предложка» — папка `s_<id>/index.tsx` рядом, экспортит default-компонент
// + named `meta`. Папки `s_*/` в .gitignore (эфемерные, чищу старые), поэтому
// автодискавери через import.meta.glob: на чистом чекауте совпадений нет → `{}`,
// сборка не падает и роуты просто отсутствуют (ноль в бандле). Локально glob
// находит мои предложки и заводит роуты без правки реестра руками.
type SuggestionMeta = {
  path: string;
  title: string;
  /** Короткая суть «в чём вопрос» — показывается в индексе. */
  question?: string;
  /** Дата заведения (YYYY-MM-DD) — для сортировки/контекста в индексе. */
  date?: string;
};
type SuggestionModule = { default: ComponentType; meta: SuggestionMeta };

const modules = import.meta.glob<SuggestionModule>('./s_*/index.tsx', {
  eager: true,
});

// Новые сверху: сортируем по дате убыв., затем по пути.
const suggestions = Object.values(modules)
  .filter((m) => m?.default && m?.meta?.path)
  .map((m) => ({ meta: m.meta, Component: m.default }))
  .sort(
    (a, b) =>
      (b.meta.date ?? '').localeCompare(a.meta.date ?? '') ||
      a.meta.path.localeCompare(b.meta.path),
  );

// Индекс: список всех живых предложек со ссылками + метаданными (вопрос, дата) —
// чтобы ничего не терялось. Стили — из закреплённой обвязки, не inline.
function DevSuggestionsIndex() {
  return (
    <main className={s.index}>
      <h1 className={s.title}>Предложки · dev</h1>
      <p className={s.lead}>
        Живые превью предложений на отдельных роутах. Эфемерны (в .gitignore).
      </p>
      {suggestions.length === 0 ? (
        <p className={s.empty}>Пока пусто.</p>
      ) : (
        <ul className={s.indexList}>
          {suggestions.map((item) => (
            <li key={item.meta.path} className={s.indexItem}>
              <Link to={item.meta.path} className={s.indexLink}>
                {item.meta.title}
              </Link>
              {item.meta.question ? (
                <span className={s.indexQuestion}>{item.meta.question}</span>
              ) : null}
              <span className={s.indexMeta}>
                {item.meta.date ? `${item.meta.date} · ` : ''}
                {item.meta.path}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// Один layout-роут (DevShell) с детьми = индекс + по роуту на предложку. Standalone:
// подключается в router.tsx как top-level sibling корневого <App>, вне AuthGate.
export const devRoute: RouteObject = {
  element: <DevShell />,
  children: [
    { path: '/dev-suggestions', element: <DevSuggestionsIndex /> },
    ...suggestions.map((s) => ({
      path: s.meta.path,
      element: <s.Component />,
    })),
  ],
};

import type { ReactNode } from 'react';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';

import s from './SuggestionLayout.module.scss';

// Закреплённая обвязка предложек. Примитивы вместо ручной вёрстки — единый вид,
// токены, адаптив (грид сам стопкается на узком). Фича ?pick=<key> подсвечивает
// выбранный вариант, чтобы читать решение из URL без чата.

export function SuggestionPage({ children }: { children: ReactNode }) {
  return <main className={s.page}>{children}</main>;
}

export function SuggestionHeader({
  kicker = 'Песочница предложений · dev',
  title,
  lead,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <header className={s.header}>
      <p className={s.kicker}>{kicker}</p>
      <h1 className={s.title}>{title}</h1>
      {lead ? <p className={s.lead}>{lead}</p> : null}
    </header>
  );
}

export function OptionGrid({ children }: { children: ReactNode }) {
  return <div className={s.grid}>{children}</div>;
}

/** Хук для самой предложки: что выбрано через ?pick= (если нужно ветвление). */
export function usePickedOption(): string | null {
  const [params] = useSearchParams();
  return params.get('pick');
}

export function OptionCard({
  optionKey,
  label,
  title,
  caption,
  changes,
  recommended = false,
  children,
}: {
  /** Ключ варианта для ?pick=<optionKey>. По умолчанию = label. */
  optionKey?: string;
  label: string;
  title: ReactNode;
  caption?: ReactNode;
  changes?: ReactNode[];
  recommended?: boolean;
  /** Живое превью варианта. */
  children: ReactNode;
}) {
  const picked = usePickedOption();
  const key = optionKey ?? label;
  const isPicked = picked != null && picked === key;

  const badgeText = [
    label,
    isPicked ? '· выбран' : recommended ? '· рекомендую' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={clsx(
        s.card,
        recommended && s.cardRec,
        isPicked && s.cardPicked,
      )}
    >
      <div className={s.cardHead}>
        <span
          className={clsx(
            s.badge,
            recommended && s.badgeRec,
            isPicked && s.badgePicked,
          )}
        >
          {badgeText}
        </span>
        <h3 className={s.cardTitle}>{title}</h3>
      </div>

      {changes?.length ? (
        <ul className={s.changes}>
          {changes.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      ) : null}

      <figure className={s.preview}>
        {caption ? <figcaption className={s.caption}>{caption}</figcaption> : null}
        <div
          className={s.frame}
          role="group"
          aria-label={`Превью варианта ${label}`}
        >
          {children}
        </div>
      </figure>
    </article>
  );
}

export function Verdict({
  title = 'Моя рекомендация',
  children,
}: {
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className={s.verdict}>
      <p className={s.verdictTitle}>{title}</p>
      <p className={s.verdictText}>{children}</p>
    </aside>
  );
}

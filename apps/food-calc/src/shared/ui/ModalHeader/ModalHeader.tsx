import type { ReactNode } from 'react';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
import { IconButton } from '@/shared/ui/atoms/Button';
import { Heading, QuietLabel } from '@/shared/ui/atoms/Typography';
import s from './ModalHeader.module.scss';

export type ModalHeaderProps = {
  /** Заголовок экрана / шага / atom-панели. Обязателен. */
  title: ReactNode;
  /**
   * Опциональная вторая строка под заголовком (serif italic, мельче) — для
   * контекста вроде даты разбора. Центрируется вместе с заголовком.
   */
  subtitle?: ReactNode;
  /**
   * Leading-слот — всегда стрелка «‹». Что делает — решает caller:
   * шаг визарда >1 → предыдущий шаг; шаг 1 / одношаговая → закрыть модалку;
   * atom-панель → возврат к выбору типа атома.
   */
  onBack: () => void;
  /** a11y-метка back-кнопки. */
  backLabel?: string;
  /** Опциональный правый слот (инфо / доп. действие). */
  trailing?: ReactNode;
  /**
   * Опциональная мета справа от заголовка (напр. дата «09.07»). Когда задана,
   * заголовок покидает absolute-центрирование и полоса раскидывается на три части
   * по ширине: `title` слева на рельсе — middot `·` ПО ЦЕНТРУ зазора — `titleMeta`
   * у правого края. Тихая (`--sys-color-text-secondary`). Требует `titleAlign="rail"`.
   */
  titleMeta?: ReactNode;
  /**
   * `modal` (default) — 32px serif заголовок для полноэкранных модалок.
   * `compact` — 24px, для вложенных мелких панелей (atom-панели).
   */
  size?: 'modal' | 'compact';
  /**
   * Выравнивание заголовка по горизонтали:
   * - `center` (default) — абсолютный центр полосы (стрелка/трейлинг его не сдвигают);
   * - `rail` — заголовок ПОКИДАЕТ центр и встаёт на «рельсу» контента: левый край
   *   текста = `var(--rail-text)`, которую экран-хозяин задаёт на общем предке
   *   (см. SearchFood `.content`). Так заголовок встаёт на ОДНУ вертикаль с именами
   *   карточек и плейсхолдером поиска. Fallback рельсы = сразу за back-кнопкой.
   */
  titleAlign?: 'center' | 'rail';
  /**
   * Доп. класс на корневую полосу. Нужен, когда хост-экран растянут во всю ширину
   * (SearchFood с full-bleed `.content`) и должен вернуть полосе собственный
   * горизонтальный инсет: padding НЕ сдвигает absolute rail-заголовок (`left:
   * --rail-text` считается от padding-box), двигает только back-кнопку и трейлинг.
   */
  className?: string;
};

/**
 * ModalHeader — единая верхняя обвязка модалок: стрелка назад слева + заголовок.
 * `ModalStepHeader` строится поверх него, добавляя ряд breadcrumbs.
 */
export const ModalHeader = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Назад',
  trailing,
  size = 'modal',
  titleAlign = 'center',
  titleMeta,
  className,
}: ModalHeaderProps) => {
  const split = titleMeta != null;
  const titleBlockClass = [
    s.titleBlock,
    titleAlign === 'rail' ? s.titleBlockRail : '',
    split ? s.titleBlockSplit : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <header
      className={[s.header, size === 'compact' ? s.compact : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <IconButton
        tone="soft"
        emphasis="quiet"
        icon={<ArrowLeftIcon />}
        aria-label={backLabel}
        onClick={onBack}
        className={s.backButton}
      />
      <div className={titleBlockClass}>
        <Heading role="headline" as="h2" className={s.title}>
          {title}
        </Heading>
        {split ? (
          <>
            <span aria-hidden className={s.titleSep}>
              ·
            </span>
            <span className={s.titleMeta}>{titleMeta}</span>
          </>
        ) : (
          subtitle != null && <QuietLabel className={s.subtitle}>{subtitle}</QuietLabel>
        )}
      </div>
      {trailing != null && <div className={s.trailing}>{trailing}</div>}
    </header>
  );
};

ModalHeader.displayName = 'ModalHeader';

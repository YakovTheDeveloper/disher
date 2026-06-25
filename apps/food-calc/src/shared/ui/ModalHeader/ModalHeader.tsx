import type { ReactNode } from 'react';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
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
   * `modal` (default) — 32px serif заголовок для полноэкранных модалок.
   * `compact` — 24px, для вложенных мелких панелей (atom-панели).
   */
  size?: 'modal' | 'compact';
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
}: ModalHeaderProps) => (
  <header className={size === 'compact' ? `${s.header} ${s.compact}` : s.header}>
    <button className={s.backButton} onClick={onBack} type="button" aria-label={backLabel}>
      <ArrowLeftIcon />
    </button>
    <div className={s.titleBlock}>
      <Heading role="headline" as="h2" className={s.title}>
        {title}
      </Heading>
      {subtitle != null && <QuietLabel className={s.subtitle}>{subtitle}</QuietLabel>}
    </div>
    {trailing != null && <div className={s.trailing}>{trailing}</div>}
  </header>
);

ModalHeader.displayName = 'ModalHeader';

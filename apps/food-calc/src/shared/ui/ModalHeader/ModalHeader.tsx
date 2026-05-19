import type { ReactNode } from 'react';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg';
import { Heading } from '@/shared/ui/atoms/Typography';
import s from './ModalHeader.module.scss';

export type ModalHeaderProps = {
  /** Заголовок экрана / шага / atom-панели. Обязателен. */
  title: ReactNode;
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
};

/**
 * ModalHeader — единая верхняя обвязка модалок: стрелка назад слева + заголовок.
 * `ModalStepHeader` строится поверх него, добавляя ряд breadcrumbs.
 */
export const ModalHeader = ({ title, onBack, backLabel = 'Назад', trailing }: ModalHeaderProps) => (
  <header className={s.header}>
    <button className={s.backButton} onClick={onBack} type="button" aria-label={backLabel}>
      <ArrowLeftIcon />
    </button>
    <Heading size="modal" as="h2" className={s.title}>
      {title}
    </Heading>
    {trailing != null && <div className={s.trailing}>{trailing}</div>}
  </header>
);

ModalHeader.displayName = 'ModalHeader';

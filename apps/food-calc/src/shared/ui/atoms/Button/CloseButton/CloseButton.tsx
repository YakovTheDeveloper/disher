import s from './CloseButton.module.css';

type Props = {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
};

/**
 * CloseButton — единый «×» для закрытия оверлеев, которые НЕ используют
 * ModalHeader (full-height модалки без backdrop-dismiss: длинный разбор,
 * «Разбор по неделям»). Тихий ink-глиф с press-tint. Для модалок с ModalHeader
 * закрытие/назад живёт в самой шапке — этот примитив для остальных.
 */
export const CloseButton = ({ onClick, ariaLabel = 'Закрыть', className }: Props) => (
  <button
    type="button"
    className={className ? `${s.close} ${className}` : s.close}
    onClick={onClick}
    aria-label={ariaLabel}
  >
    ×
  </button>
);

export default CloseButton;

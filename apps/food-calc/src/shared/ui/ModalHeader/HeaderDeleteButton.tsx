import s from './HeaderDeleteButton.module.scss';

// Изящная корзина: тонкий штрих (1.3), слегка конусный бак со скруглённым дном,
// аккуратная дужка-крышка с закруглёнными углами и два сужающихся книзу зубца.
const TrashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4.5 7h15M9.5 7V5.6c0-.61.5-1.1 1.1-1.1h2.8c.61 0 1.1.49 1.1 1.1V7M6.5 7l1.2 11.1a1.6 1.6 0 0 0 1.6 1.5h5.4a1.6 1.6 0 0 0 1.6-1.5L17.5 7"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.3 10.6l.25 5.7M13.7 10.6l-.25 5.7"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Props = {
  onClick: () => void;
  disabled?: boolean;
  /** a11y-метка, напр. «Удалить гипотезу». По умолчанию — «Удалить». */
  label?: string;
};

/**
 * Серая урна для правого слота обвязки модалок РЕДАКТИРОВАНИЯ сущностей
 * (`ModalHeader.trailing`): Hypothesis / Dish / Product. Тихий деструктив —
 * цвет `--text-secondary` (не danger); подтверждение (ConfirmModal) и сама
 * мутация живут на стороне caller'а. ≥40px тап-таргет, нейтральный press-тинт.
 */
export const HeaderDeleteButton = ({ onClick, disabled, label = 'Удалить' }: Props) => (
  <button
    type="button"
    className={s.button}
    disabled={disabled}
    onClick={onClick}
    aria-label={label}
  >
    <TrashIcon />
  </button>
);

HeaderDeleteButton.displayName = 'HeaderDeleteButton';

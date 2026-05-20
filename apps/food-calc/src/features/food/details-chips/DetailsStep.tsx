import { DetailsChips } from './DetailsChips';
import s from './DetailsStep.module.scss';

/**
 * Шаг «Особенности» — открывается с уже поднятой клавиатурой, свёрстан плотно.
 * Свой заголовок не несёт: его даёт заголовок модалки (StepHeader). Название
 * еды опционально — вспомогательный эйброу справа над инпутом рядом с кнопкой-
 * инфо; на шаге создания еды ссылки на конкретную еду ещё нет, эйброу скрыт.
 * Чипы — единый поток без под-групп (больше влезает над клавиатурой).
 */
const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.75" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fill="currentColor"
      fontFamily="'Source Serif 4', 'Source Serif Pro', Georgia, serif"
      fontStyle="italic"
      fontSize="16"
      fontWeight="300"
    >
      i
    </text>
  </svg>
);

type Props = {
  /** Название еды — вспомогательный эйброу + хвост плейсхолдера. Опционально:
   *  на шаге создания еды ссылки на конкретную еду ещё нет. */
  title?: string;
  /** Кнопка-иконка «Информация о продукте/блюде». null на шаге создания. */
  info?: { label: string; onClick: () => void } | null;
  textareaId: string;
  value: string;
  onChange: (next: string) => void;
  productId: string | null;
};

export function DetailsStep({ title, info, textareaId, value, onChange, productId }: Props) {
  const placeholder = title
    ? `Особенности приема ${title.toLowerCase()}`
    : 'Особенности приема';
  const showEyebrow = Boolean(title) || Boolean(info);

  return (
    <div className={s.root}>
      {showEyebrow && (
        <div className={s.eyebrow}>
          {title && <span className={s.eyebrowName}>{title}</span>}
          {info && (
            <button
              type="button"
              className={s.infoBtn}
              aria-label={info.label}
              onClick={info.onClick}
            >
              <InfoIcon />
            </button>
          )}
        </div>
      )}

      <DetailsChips
        textareaId={textareaId}
        value={value}
        onChange={onChange}
        productId={productId}
        placeholder={placeholder}
        showSectionLabels={false}
      />
    </div>
  );
}

export default DetailsStep;

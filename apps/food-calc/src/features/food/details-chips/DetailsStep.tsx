import { Heading } from '@/shared/ui/atoms/Typography';
import { DetailsChips } from './DetailsChips';
import s from './DetailsStep.module.scss';

/**
 * Шаг «Уточнение» — открывается с уже поднятой клавиатурой, свёрстан плотно.
 * Главный — заголовок задачи; название еды вспомогательное, вынесено в мелкий
 * эйброу справа над инпутом рядом с кнопкой-инфо. Чипы — единый поток без
 * под-групп (больше влезает над клавиатурой).
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
  /** Название еды — вспомогательный эйброу + хвост плейсхолдера. */
  title: string;
  /** Кнопка-иконка «Информация о продукте/блюде». null на шаге создания. */
  info?: { label: string; onClick: () => void } | null;
  textareaId: string;
  value: string;
  onChange: (next: string) => void;
  productId: string | null;
};

export function DetailsStep({ title, info, textareaId, value, onChange, productId }: Props) {
  return (
    <div className={s.root}>
      <Heading size="modal" as="h2" className={s.heading}>
        Особенности приема
      </Heading>

      <div className={s.eyebrow}>
        <span className={s.eyebrowName}>{title}</span>
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

      <DetailsChips
        textareaId={textareaId}
        value={value}
        onChange={onChange}
        productId={productId}
        placeholder={`Особенности приема ${title.toLowerCase()}`}
        showSectionLabels={false}
      />
    </div>
  );
}

export default DetailsStep;

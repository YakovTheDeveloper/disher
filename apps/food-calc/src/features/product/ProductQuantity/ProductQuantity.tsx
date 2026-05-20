import { useRef, useState } from 'react';
import style from './ProductQuantity.module.scss';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { Chip } from '@/shared/ui/atoms/Chip';

export type Portion = { label: string; grams: number };

type ProductQuantityContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
  product?: { portions?: Portion[] } | null;
  dish?: { portions?: Portion[] } | null;
};

type Props = {
  content: ProductQuantityContent;
  onFinish: () => void;
  inputId?: string;
  isActive?: boolean;
};

// Outer component: ALWAYS renders the hero <NumberInput id={inputId}> in the same
// DOM node so <label htmlFor={inputId}> focus delegation keeps working on iOS even
// when this step is not active. Heavy work (portion chips, multiplier UI) lives
// in <ProductQuantityHeavy> which is conditionally mounted via {isActive && ...}.
// See feedback_ios_focus.md for why the input must stay in the same DOM node.
const ProductQuantity = ({
  onFinish,
  content,
  inputId = 'quantity-input',
  isActive = true,
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(content.quantity);
  const [activePortion, setActivePortion] = useState<Portion | null>(null);
  const [multiplier, setMultiplier] = useState(1);

  const onBlur = () => {
    content.updateQuantity(value);
    onFinish();
  };

  const applyPortion = (portion: Portion, mult: number) => {
    const newValue = Math.round(portion.grams * mult);
    setValue(newValue);
    content.updateQuantity(newValue);
  };

  const handlePortionClick = (portion: Portion) => {
    const isSame = activePortion?.grams === portion.grams && activePortion?.label === portion.label;
    if (isSame) {
      setActivePortion(null);
      setMultiplier(1);
      return;
    }
    setActivePortion(portion);
    setMultiplier(1);
    applyPortion(portion, 1);
  };

  const handleMultiplierChange = (newMult: number) => {
    const mult = Math.max(0.5, newMult);
    setMultiplier(mult);
    if (activePortion) {
      applyPortion(activePortion, mult);
    }
  };

  return (
    <div className={style.container}>
      <div className={style.inputWrapper}>
        <div className={style.inputRow}>
          {/* Auto-grow input: a span mirrors the digits with the same font,
              so its width = the real rendered width of the number. The
              <input> is absolutely placed on top of the span, so the
              wrapper's flex layout sees the SPAN's width — and the .unit
              sibling sits flush against the last digit, not a fixed ch box.
              Works in every browser (no field-sizing dependency). */}
          <span className={style.inputBox}>
            <span aria-hidden className={style.mirror}>
              {value || 0}
            </span>
            <NumberInput
              id={inputId}
              placeholder="Количество"
              ref={inputRef}
              className={style.input}
              onChange={setValue}
              value={value}
              onBlur={onBlur}
              maxLength={5}
            />
          </span>
          <span className={style.unit}>{'г'}</span>
        </div>
      </div>

      {isActive && (
        <ProductQuantityHeavy
          content={content}
          activePortion={activePortion}
          multiplier={multiplier}
          onPortionClick={handlePortionClick}
          onMultiplierChange={handleMultiplierChange}
        />
      )}
    </div>
  );
};

type HeavyProps = {
  content: ProductQuantityContent;
  activePortion: Portion | null;
  multiplier: number;
  onPortionClick: (portion: Portion) => void;
  onMultiplierChange: (mult: number) => void;
};

const ProductQuantityHeavy = ({
  content,
  activePortion,
  multiplier,
  onPortionClick,
  onMultiplierChange,
}: HeavyProps) => {
  const portions = content.product?.portions || content.dish?.portions || [];

  if (portions.length === 0) return null;

  return (
    <div className={style.section}>
      {/* Plain wrapping row — the portion set is small, so showing every chip
          at once beats a horizontal scroll (no hidden affordance, no JS). */}
      <div className={style.portionChips}>
        {portions.map((portion) => (
          <Chip
            key={`${portion.label}-${portion.grams}`}
            className={style.portionChip}
            active={
              activePortion?.grams === portion.grams && activePortion?.label === portion.label
            }
            onClick={() => onPortionClick(portion)}
          >
            {portion.label} ({portion.grams}г)
          </Chip>
        ))}
      </div>

      {activePortion && (
        <div className={style.multiplierRow}>
          <button
            type="button"
            className={style.multiplierBtn}
            onClick={() => onMultiplierChange(multiplier - 0.5)}
          >
            −
          </button>
          <NumberInput
            className={style.multiplierInput}
            value={multiplier}
            onChange={onMultiplierChange}
            placeholder="×"
          />
          <button
            type="button"
            className={style.multiplierBtn}
            onClick={() => onMultiplierChange(multiplier + 0.5)}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductQuantity;

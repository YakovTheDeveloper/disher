import { useRef, useState, useMemo } from 'react';
import style from './ProductQuantity.module.scss';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import clsx from 'clsx';

type QuickButtonProps = {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
};

const QuickButton = ({ children, isActive, onClick, className }: QuickButtonProps) => (
  <button type="button" onClick={onClick} className={clsx(className, isActive && 'is-selected')}>
    {children}
  </button>
);

export type Portion = { label: string; grams: number; amount: number; unit: string };

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

const SLIDE_SIZE = 8; // 2 rows x 4 columns

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Outer component: ALWAYS renders the hero <NumberInput id={inputId}> in the same
// DOM node so <label htmlFor={inputId}> focus delegation keeps working on iOS even
// when this step is not active. Heavy work (portions carousel, multiplier UI) lives
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
    const isSame =
      activePortion?.grams === portion.grams && activePortion?.label === portion.label;
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
        <NumberInput
          id={inputId}
          placeholder="Количество"
          ref={inputRef}
          className={style.input}
          onChange={setValue}
          value={value}
          onBlur={onBlur}
          bottom={
            <span className={style.unit}>
              {activePortion ? `${multiplier} × ${activePortion.label}` : 'граммы'}
            </span>
          }
        />
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

  const portionSlides = useMemo(
    () =>
      chunkArray(
        portions.map((p) => ({ label: `${p.label} (${p.grams}г)`, portion: p })),
        SLIDE_SIZE,
      ),
    [portions],
  );

  if (portionSlides.length === 0) return null;

  return (
    <div className={style.section}>
      <span className={style.sectionLabel}>Порции</span>
      <div className={style.snapViewport}>
        <div className={style.snapContainer}>
          {portionSlides.map((slideItems, slideIndex) => (
            <div key={slideIndex} className={style.snapSlide}>
              <div className={style.slideGrid}>
                {slideItems.map((item) => (
                  <QuickButton
                    key={item.label}
                    className={style.quickBtn}
                    isActive={
                      activePortion?.grams === item.portion.grams &&
                      activePortion?.label === item.portion.label
                    }
                    onClick={() => onPortionClick(item.portion)}
                  >
                    {item.label}
                  </QuickButton>
                ))}
              </div>
            </div>
          ))}
        </div>
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

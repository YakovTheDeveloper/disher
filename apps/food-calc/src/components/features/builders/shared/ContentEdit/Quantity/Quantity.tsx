import { observer } from 'mobx-react-lite';
import { useRef, useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import style from './Quantity.module.scss';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { QuickButton } from '@/components/features/builders/shared/atoms/QuickButtons/QuickButton';
import { Instance } from 'mobx-state-tree';
import { Portion } from '@/domain/product/ProductPortions/ProductPortions';
import { FoodContentInstance } from '@/domain/shared/foodContent/foodContent';

const variants = [
  [25, 50, 75, 100],
  [150, 200, 300, 400],
  [500, 1000, 2000, 3000],
];

type QuickButtonData = {
  quantity: number;
  label: string;
};

type Props = {
  content: FoodContentInstance;
  onFinish: () => void;
};

const SLIDE_SIZE = 8; // 2 rows × 4 columns

// Разделить массив на слайды по 8 элементов (2×4 сетка)
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const Quantity = ({ onFinish, content }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [value, setValue] = useState(content.quantity);

  // Get portions from food if available
  const portions = content.food?.portions || content.dish?.portions || [];

  // Build quick buttons data
  const quickButtons: QuickButtonData[] =
    portions.length > 0
      ? portions.map((portion: Instance<typeof Portion>) => ({
          quantity: portion.grams,
          label: `${portion.amount} ${portion.unit} (${portion.grams}г)`,
        }))
      : [];

  const quickButtons2: QuickButtonData[] = variants.flat().map((quantity) => ({
    quantity,
    label: quantity.toString(),
  }));

  // Разбиваем на слайды по 8 элементов (2×4 сетка)
  const portionSlides = useMemo(() => chunkArray(quickButtons, SLIDE_SIZE), [quickButtons]);
  const quantitySlides = useMemo(() => chunkArray(quickButtons2, SLIDE_SIZE), [quickButtons2]);

  // Embla carousel для порций
  const [portionsEmblaRef] = useEmblaCarousel(
    {
      loop: false,
      dragFree: false,
      containScroll: 'trimSnaps',
      duration: 30,
    },
    []
  );

  // Embla carousel для количества
  const [quantitiesEmblaRef] = useEmblaCarousel(
    {
      loop: false,
      dragFree: false,
      containScroll: 'trimSnaps',
      duration: 30,
    },
    []
  );

  const onBlur = () => {
    content.updateQuantity(value);
    onFinish();
  };

  const handleVariantClick = (quantity: number) => {
    setValue(quantity);
    content.updateQuantity(quantity);
  };

  return (
    <div className={style.container}>
      {/* Input - full width */}
      <div className={style.inputWrapper}>
        <NumberInput
          size="big"
          boxShadow
          placeholder="Введите количество"
          ref={inputRef}
          className={style.input}
          onChange={setValue}
          value={value}
          onBlur={onBlur}
        />
        <span className={style.unit}>г.</span>
      </div>

      {/* Portions carousel - 2×4 grid per slide */}
      {portionSlides.length > 0 && (
        <div className={style.emblaViewport} ref={portionsEmblaRef}>
          <div className={style.emblaContainer}>
            {portionSlides.map((slideButtons, slideIndex) => (
              <div key={slideIndex} className={style.emblaSlide}>
                <div className={style.slideGrid}>
                  {slideButtons.map((button) => (
                    <QuickButton
                      key={button.quantity}
                      isActive={button.quantity === value}
                      onClick={() => handleVariantClick(button.quantity)}
                    >
                      {button.label}
                    </QuickButton>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quantities carousel - 2×4 grid per slide */}
      {quantitySlides.length > 0 && (
        <div className={style.emblaViewport} ref={quantitiesEmblaRef}>
          <div className={style.emblaContainer}>
            {quantitySlides.map((slideButtons, slideIndex) => (
              <div key={slideIndex} className={style.emblaSlide}>
                <div className={style.slideGrid}>
                  {slideButtons.map((button) => (
                    <QuickButton
                      key={button.quantity}
                      isActive={button.quantity === value}
                      onClick={() => handleVariantClick(button.quantity)}
                    >
                      {button.label}
                    </QuickButton>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default observer(Quantity);

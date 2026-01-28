import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect } from 'react';
import style from './Quantity.module.scss';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { QuickButton } from '@/components/features/builders/food/shared/atoms/QuickButtons/QuickButton';
import { emitter } from '@/infrastructure/emitter/emitter';
import { useListFadeEffect } from '@/hooks/useListFadeEffect';
import { Instance } from 'mobx-state-tree';
import { Portion } from '@/domain/product/ProductPortions/ProductPortions';

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
  item:
    | ({
        quantity: number;
        updateQuantity: (quantity: number) => void;
      } & {
        content?: {
          food?: {
            portions?: Instance<typeof Portion>[];
          };
        };
      })
    | any;
  onFinish: () => void;
};

const Quantity = ({ onFinish, item }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const variantsRef = useRef<HTMLDivElement | null>(null);

  const [value, setValue] = useState(item.quantity);

  const fadeClasses = useListFadeEffect({ containerRef: variantsRef });

  // Get portions from food if available
  const portions = (item as any).content?.food?.portions || [];

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

  useEffect(() => {
    const handler = () => inputRef.current?.focus();
    emitter.on('WIZARD_FOCUS', handler);
    return () => emitter.off('WIZARD_FOCUS', handler);
  }, []);

  const onBlur = () => {
    item.updateQuantity(value);
    // onFinish()
  };

  const handleVariantClick = (quantity: number) => {
    setValue(quantity);
    item.updateQuantity(quantity);
    // onFinish();
  };

  // useEffect(() => {
  //   inputRef.current?.focus();
  // }, []);

  return (
    <div className={style.container}>
      <div ref={variantsRef} className={`${style.variants} ${fadeClasses}`}>
        {quickButtons.map((button) => (
          <QuickButton
            key={button.quantity}
            isActive={button.quantity === value}
            onClick={() => handleVariantClick(button.quantity)}
          >
            {button.label}
          </QuickButton>
        ))}
      </div>
      <div className={style.inputWrapper}>
        <NumberInput
          // autoFocus
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
      <div ref={variantsRef} className={`${style.variants} ${fadeClasses}`}>
        {quickButtons2.map((button) => (
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
  );
};

export default observer(Quantity);

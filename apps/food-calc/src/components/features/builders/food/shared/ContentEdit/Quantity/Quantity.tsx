import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import style from './Quantity.module.scss';
import commonStyle from '../ContentEdit.module.scss';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';

const variants = [25, 50, 75, 100, 150, 200, 300, 400, 500, 1000, 2000, 3000];

type Props = {
  item: {
    quantity: number;
    updateQuantity: (quantity: number) => void;
  };
  onFinish: () => void;
};

const Quantity = ({ onFinish, item }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [value, setValue] = useState(item.quantity);

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
    <div className={clsx([style.container, commonStyle.SuggestionWrapper])}>
      <div className={style.variants}>
        <div className={style.inputWrapper}>
          <NumberInput
            autoFocus
            placeholder="Введите количество"
            ref={inputRef}
            className={style.input}
            onChange={setValue}
            value={value}
            onBlur={onBlur}
          />
          <span className={style.unit}>г.</span>
        </div>
        <button onClick={onFinish}>Подтвердить</button>
        {variants.map((quantity) => (
          <button
            key={quantity}
            onClick={() => handleVariantClick(quantity)}
            className={clsx(style.variant, {
              [style.variantActive]: Number(item.quantity) === quantity,
            })}
          >
            {quantity} г.
          </button>
        ))}
      </div>
    </div>
  );
};

export default observer(Quantity);

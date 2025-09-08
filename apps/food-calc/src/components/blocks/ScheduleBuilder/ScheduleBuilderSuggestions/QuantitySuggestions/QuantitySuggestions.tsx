import { ScheduleBuilderViewModel } from '@/components/blocks/ScheduleBuilder/model/ScheduleBuilderViewModel';
import style from './QuantitySuggestions.module.scss';
import commonStyle from '../ScheduleBuilderSuggestions.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

type Props = {
  vm: {
    currentScheduleItem: ScheduleBuilderViewModel['currentScheduleItem'];
    acceptQuantity: ScheduleBuilderViewModel['acceptQuantity'];
  };
};

const variants = [
  [25, 50, 75],
  [100, 150, 200],
  [300, 400, 500],
  [1000, 2000, 3000],
].flatMap((val) => val);

const QuantitySuggestions = ({ vm }: Props) => {
  const initQuantity = vm.currentScheduleItem?.quantity;

  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const customInputRef = useRef<HTMLInputElement | null>(null);

  const showCustomInput = () => setIsCustom(true);
  const hideCustomInput = () => setIsCustom(false);
  const onCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
  };

  useEffect(() => {
    if (!isCustom) return;
    customInputRef.current?.focus();
  }, [isCustom]);

  const onCustomButtonClick = () => {
    if (isCustom) {
      const quantity = Number(customValue);
      vm.acceptQuantity(quantity);
      return;
    }
    showCustomInput();
  };

  const customInputStyle = {
    width: `${customValue.length + 1}ch`,
  };

  const customQuantitytUnitStyle = {
    paddingLeft: `${customValue.length + 1}ch`,
  };

  const customBackgroundStyle = {
    transform: `translate(-50%, -50%) rotate(${90 * customValue.length}deg)`,
  };

  console.log(initQuantity);

  return (
    <div className={clsx([style.container, commonStyle.SuggestionWrapper])}>
      <div className={clsx([style.items])}>
        <button onClick={onCustomButtonClick} className={clsx([style.item, style.item_custom])}>
          {isCustom ? (
            <>
              <input
                style={customInputStyle}
                ref={customInputRef}
                onChange={onCustomChange}
                maxLength={4}
                value={customValue}
              ></input>
              <span style={customQuantitytUnitStyle} className={style.itemUnit}>
                {' '}
                г.
              </span>
              <span style={customBackgroundStyle} className={clsx([style.item_background])}></span>
            </>
          ) : (
            'Кастом'
          )}
        </button>
        {variants.map((quantity) => (
          <button
            onClick={() => vm.acceptQuantity(quantity)}
            key={quantity}
            className={clsx([
              style.item,
              !isCustom && initQuantity === quantity && style.item_active,
            ])}
          >
            {quantity} г.
          </button>
        ))}
      </div>
    </div>
  );
};

export default observer(QuantitySuggestions);

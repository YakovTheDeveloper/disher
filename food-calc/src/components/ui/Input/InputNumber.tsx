import React, { ChangeEvent, useRef } from 'react';
import s from './InputNumber.module.css';
import { observer } from 'mobx-react-lite';

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    max?: number;
    disabled?: boolean;
}

const INCREMENT_STEP = 10;

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, max = 10000, disabled }) => {
    const clampValue = (newValue: number) => {
        if (newValue < 0) return 0;
        if (newValue > max) return max;
        return newValue;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        if (/^\d*$/.test(inputValue)) {
            const newValue = +inputValue;
            onChange(clampValue(newValue));
        }
    };

    const handleScroll = (e: React.WheelEvent<HTMLInputElement>) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? INCREMENT_STEP : -INCREMENT_STEP;
        onChange(clampValue(value + delta));
    };

    const increment = () => onChange(clampValue(value + INCREMENT_STEP));
    const decrement = () => onChange(clampValue(value - INCREMENT_STEP));

    return (
        <div className={s.container}>
            <div className={s.inputWrapper}>
                <input
                    className={s.numberInput}
                    type="number"
                    step={10}
                    disabled={disabled}
                    value={value?.toString() || '0'}
                    onChange={handleChange}
                    maxLength={max.toString().length}
                    onWheel={handleScroll}
                />
            </div>
        </div>
    );
};

export default observer(NumberInput);

import React, { ChangeEvent, useRef } from 'react';
import s from './InputNumber.module.css';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

interface NumberInputProps {
    value: number;
    className?: string;
    wrapperClassName?: string;
    onChange: (value: number) => void;
    max?: number;
    disabled?: boolean;
    step?: number
}

const INCREMENT_STEP = 10;

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, max = 10000, disabled, wrapperClassName, className, step = 10 }) => {
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
        // e.preventDefault();
        const delta = e.deltaY < 0 ? INCREMENT_STEP : -INCREMENT_STEP;
        onChange(clampValue(value + delta));
    };

    return (
        <div className={clsx([s.inputWrapper, wrapperClassName])}>
            <input
                className={clsx([s.numberInput, className])}
                type="number"
                step={step}
                disabled={disabled}
                value={value?.toString() || '0'}
                onChange={handleChange}
                maxLength={max.toString().length}
                onWheel={handleScroll}
            />
        </div>
    );
};

export default observer(NumberInput);

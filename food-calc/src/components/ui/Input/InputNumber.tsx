import React, { ChangeEvent } from 'react';
import s from './InputNumber.module.css';

interface NumberInputProps {
    value: number; // Controlled value
    onChange: (value: number) => void; // Callback function for value change
    max: number; // Maximum number of characters
    disabled?: boolean
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, max, disabled }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Allow only numeric values and enforce the maximum length
        if (/^\d*$/.test(inputValue) && inputValue.length <= max) {
            onChange(+inputValue);
        }
    };

    return (
        <input
            className={s.numberInput}
            type="text"
            disabled={disabled}
            value={value.toString()}
            onChange={handleChange}
            maxLength={max}
        />
    );
};

export default NumberInput;

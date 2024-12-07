import React, { ChangeEvent } from 'react';
import s from './InputNumber.module.css';
import { observer } from 'mobx-react-lite';

interface NumberInputProps {
    value: number; // Controlled value
    onChange: (value: number) => void; // Callback function for value change
    max: number; // Maximum number of characters
    disabled?: boolean
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, max, disabled }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        console.log("nutrient ibput", inputValue)

        if (/^\d*$/.test(inputValue) && inputValue.length <= max) {
            onChange(+inputValue);
            console.log("nutrient 1212")

        }
    };

    return (
        <input
            className={s.numberInput}
            type="text"
            disabled={disabled}
            value={value?.toString() || 0}
            onChange={handleChange}
            maxLength={max}
        />
    );
};

export default observer(NumberInput);

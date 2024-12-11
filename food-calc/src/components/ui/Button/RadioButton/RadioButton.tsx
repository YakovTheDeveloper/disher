import React from "react";
import TickIcon from "@/assets/icons/tick.svg"; // Adjust the path as needed
import s from "./RadioButton.module.css"; // Optional CSS module

interface RadioButtonProps {
    id: number;
    name: string;
    isChecked: boolean;
    onChange: (id: number) => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({
    id,
    name,
    isChecked,
    onChange,
}) => {
    return (
        <label className={s.radioButton}>
            <input
                type="radio"
                id={id.toString()}
                name={name}
                checked={isChecked}
                onChange={() => onChange(id)}
                className={s.input}
            />
            <div className={s.iconContainer}>
                {isChecked && <TickIcon className={s.tickIcon} />}
            </div>
        </label>
    );
};

export default RadioButton;

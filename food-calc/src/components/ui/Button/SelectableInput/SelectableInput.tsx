import React from "react";
import TickIcon from "@/assets/icons/tick.svg"; // Adjust the path as needed
import s from "./SelectableInput.module.css"; // Optional CSS module

interface SelectableInputProps {
    id: number;
    name: string;
    type: "radio" | "checkbox";
    isChecked: boolean;
    onChange: (id: number) => void;
}

const SelectableInput: React.FC<SelectableInputProps> = ({
    id,
    name,
    type,
    isChecked,
    onChange,
}) => {
    return (
        <label className={s.selectableInput}>
            <input
                type={type}
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

export default SelectableInput;

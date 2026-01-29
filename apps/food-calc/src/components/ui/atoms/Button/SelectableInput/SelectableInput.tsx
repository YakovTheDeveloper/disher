import React, { ReactNode } from "react";
import TickIcon from "@/assets/icons/tick.svg"; // Adjust the path as needed
import s from "./SelectableInput.module.css"; // Optional CSS module
import { observer } from "mobx-react-lite";

interface SelectableInputProps {
    id: number | string;
    name: string;
    type: "radio" | "checkbox";
    label?: ReactNode,
    isChecked: boolean;
    onChange: (id: number | string) => void;
}

const SelectableInput: React.FC<SelectableInputProps> = ({
    id,
    name,
    type,
    isChecked,
    label,
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
            {label &&
                <span className={s.label}>
                    {label}
                </span>
            }
        </label>
    );
};

export default observer(SelectableInput);

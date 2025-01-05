import React from 'react';
import styles from './ChoiceComponent.module.css';
import clsx from 'clsx';

export interface ChoiceOption {
    value: string;
    displayName: string;
}

interface ChoiceComponentProps {
    active: ChoiceOption['value']
    onChoose: (option: ChoiceOption) => void; // Callback to update the state
    options: ChoiceOption[]; // List of options with name and displayName
    className?: string; // Optional additional class name
}

const ChoiceComponent: React.FC<ChoiceComponentProps> = ({
    active,
    onChoose,
    options,
    className,
}) => {
    return (
        <div className={clsx([styles.container, className])}>
            {options.map((option) => (
                <button
                    key={option.value}
                    className={clsx(styles.choiceButton, {
                        [styles.active]: option.value === active,
                    })}
                    onClick={() => onChoose(option)}
                    aria-pressed={option.value === active}
                    aria-label={`Choose ${option.displayName}`}
                >
                    {option.displayName}
                </button>
            ))}
        </div>
    );
};

export default ChoiceComponent;
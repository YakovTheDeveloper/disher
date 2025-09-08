import React from 'react';
import styles from './ChoiceComponent.module.css';
import clsx from 'clsx';

export interface ChoiceOption {
    value: string | number;
    displayName: string;
}

interface ChoiceComponentProps {
    active: ChoiceOption['value'];
    onChoose: (option: ChoiceOption) => void; // Callback to update the state
    options: ChoiceOption[]; // List of options with name and displayName
    className?: string; // Optional additional class name
    layout?: 'horizontal' | 'vertical'; // New prop to control layout
}

const ChoiceComponent: React.FC<ChoiceComponentProps> = ({
    active,
    onChoose,
    options,
    className,
    layout = 'horizontal', // Default to horizontal layout
}) => {
    return (
        <div
            className={clsx(styles.container, className, {
                [styles.vertical]: layout === 'vertical',
            })}
        >
            {options.map((option, index) => (
                <button
                    key={option.value}
                    className={clsx(styles.choiceButton, {
                        [styles.active]: option.value === active,
                        [styles.first]: layout === 'vertical' && index === 0,
                        [styles.last]: layout === 'vertical' && index === options.length - 1,
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

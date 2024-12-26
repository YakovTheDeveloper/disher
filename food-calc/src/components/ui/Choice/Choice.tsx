import React from 'react';
import styles from './ChoiceComponent.module.css';
import clsx from 'clsx';

interface ChoiceComponentProps {
    isActive: boolean; // Current active state (true/false)
    onChoose: (value: boolean) => void; // Callback to update the state
    buttonLabels?: [string, string]; // Labels for true/false buttons, optional
    className: string
}

const ChoiceComponent: React.FC<ChoiceComponentProps> = ({
    isActive,
    onChoose,
    className,
    buttonLabels = ['Yes', 'No'], // Default labels
}) => {
    return (
        <div className={clsx([styles.container, className])}>
            <button
                className={`${styles.choiceButton} ${isActive ? styles.active : ''}`}
                onClick={() => onChoose(true)}
                aria-pressed={isActive}
                aria-label={`Choose ${buttonLabels[0]}`}
            >
                {buttonLabels[0]}
            </button>
            <button
                className={`${styles.choiceButton} ${!isActive ? styles.active : ''}`}
                onClick={() => onChoose(false)}
                aria-pressed={!isActive}
                aria-label={`Choose ${buttonLabels[1]}`}
            >
                {buttonLabels[1]}
            </button>
        </div>
    );
};

export default ChoiceComponent;

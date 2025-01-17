import React, { useState, useEffect, useRef } from 'react';
import styles from './Textarea.module.css';
import { observer } from 'mobx-react-lite';

interface TextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: React.ReactNode;
    rows?: number;
    maxLength?: number;
    debounceTime?: number;
    className?: string;
}

const Textarea: React.FC<TextareaProps> = observer(({
    value,
    onChange,
    placeholder = 'Enter text...',
    label,
    rows = 3,
    maxLength,
    debounceTime = 300,
    className,
}) => {
    const [internalValue, setInternalValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync internal value with external value if external value changes
    useEffect(() => {
        if (value !== internalValue) {
            setInternalValue(value);
        }
    }, [value]);

    // Debounce effect to call onChange after a delay
    useEffect(() => {
        const handler = setTimeout(() => {
            if (internalValue !== value) {
                onChange(internalValue);
            }
        }, debounceTime);

        return () => clearTimeout(handler);
    }, [internalValue, debounceTime, onChange]);

    // Adjust height dynamically
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [internalValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!maxLength || e.target.value.length <= maxLength) {
            setInternalValue(e.target.value);
        }
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            {label && <label className={styles.label} htmlFor="custom-textarea">{label}</label>}
            <textarea
                id="custom-textarea"
                ref={textareaRef}
                value={internalValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                rows={rows}
                className={styles.textarea}
                aria-label={label || placeholder}
            />
        </div>
    );
});

export default Textarea;

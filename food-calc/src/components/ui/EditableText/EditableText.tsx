import React, { useState } from "react";
import { Typography, TypographyProps } from "@/components/ui/Typography/Typography";
import EditIcon from "@/assets/icons/edit.svg";
import s from './EditableText.module.css';

import typoStyle from '@/components/ui/Typography/Typography.module.css';
import clsx from "clsx";

interface EditableTextProps {
    value: string; // The text value to display/edit
    onChange: (newValue: string) => void; // Callback to handle value changes
    typographyProps?: Omit<TypographyProps, "children">; // Props to pass to the Typography component (excluding 'children')
    placeholder?: string; // Optional placeholder for the input field
    max?: number; // Maximum length for the input value
    min?: number; // Minimum length for the input value
}

const EditableText = ({
    value,
    onChange,
    typographyProps,
    placeholder = "Edit text...",
    max = 50,
    min = 1,
}: EditableTextProps) => {
    const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
    const [localValue, setLocalValue] = useState(value); // Local state for editing

    const handleSave = () => {
        if (localValue.length >= min && localValue.length <= max) {
            onChange(localValue); // Update parent value only on save
        }
        setIsEditing(false); // Exit edit mode on save
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSave(); // Save on Enter key
        } else if (e.key === "Escape") {
            setIsEditing(false); // Cancel edit on Escape key
        }
    };

    const handleInputChange = (newValue: string) => {
        setLocalValue(newValue); // Update local state
    };

    const inputTypoClass = typographyProps?.variant ? typoStyle[typographyProps.variant] : '';

    return (
        <div className={s.container}>
            <button
                className={s.editButton}
                onClick={() => setIsEditing(true)}
                aria-label="Edit"
            >
                <EditIcon />
            </button>
            {isEditing ? (
                <input
                    className={clsx([s.editableTextInput, inputTypoClass])}
                    type="text"
                    value={localValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    autoFocus
                    placeholder={placeholder}
                />
            ) : (
                <>

                    <Typography {...typographyProps}>
                        {value || placeholder}
                    </Typography>
                </>
            )}
        </div>
    );
};

export default EditableText;

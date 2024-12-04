import React, { useState } from "react";
import { Typography, TypographyProps } from "@/components/ui/Typography/Typography";
import EditIcon from "@/assets/icons/edit.svg";
import s from './EditableText.module.css'

interface EditableTextProps {
    value: string; // The text value to display/edit
    onChange: (newValue: string) => void; // Callback to handle value changes
    typographyProps?: Omit<TypographyProps, "children">; // Props to pass to the Typography component (excluding 'children')
    placeholder?: string; // Optional placeholder for the input field
}

const EditableText = ({
    value,
    onChange,
    typographyProps,
    placeholder = "Edit text...",
}: EditableTextProps) => {
    const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode

    const handleSave = () => {
        setIsEditing(false); // Exit edit mode on save
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSave(); // Save on Enter key
        } else if (e.key === "Escape") {
            setIsEditing(false); // Cancel edit on Escape key
        }
    };

    return (
        <div className={s.container}>
            {isEditing ? (
                <input
                    className={s.editableTextInput}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    autoFocus
                    placeholder={placeholder}
                />
            ) : (
                <>
                    <button
                        className={s.editButton}
                        onClick={() => setIsEditing(true)}
                        aria-label="Edit"
                    >
                        <EditIcon />
                    </button>
                    <Typography {...typographyProps}>
                        {value || placeholder}
                    </Typography>
                </>
            )}
        </div>
    );
};

export default EditableText;

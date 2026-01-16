import React, { useState, useRef, useCallback, forwardRef } from 'react';
import styles from './EditableText.module.scss';
import clsx from 'clsx';
import crossIcon from '@/assets/icons/cross.svg';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  readOnly?: boolean;
  allowEmpty?: boolean;
  isClearable?: boolean;
}

const EditableText = forwardRef<HTMLDivElement, EditableTextProps>(
  (
    {
      value,
      onChange,
      placeholder = '',
      className,
      multiline = false,
      readOnly = false,
      allowEmpty = true,
      isClearable = true,
    },
    ref
  ) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    // Start editing
    const handleStartEdit = useCallback(() => {
      if (readOnly) return;
      setIsEditing(true);
      // Focus after render
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      }, 0);
    }, [readOnly]);

    // Cancel editing
    const handleCancel = useCallback(() => {
      setIsEditing(false);
    }, []);

    // Clear input
    const handleClear = useCallback(() => {
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.focus();
      }
    }, []);

    // Commit changes
    const handleCommit = useCallback(() => {
      if (!inputRef.current) return;
      const trimmedValue = inputRef.current.value.trim();
      if (!allowEmpty && !trimmedValue) {
        handleCancel();
      } else {
        setIsEditing(false);
        onChange(trimmedValue);
      }
    }, [onChange, allowEmpty, handleCancel]);

    // Handle key events
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) handleCommit();
        if (e.key === 'Escape') handleCancel();
      },
      [multiline, handleCommit, handleCancel]
    );

    if (isEditing) {
      const InputComponent = multiline ? 'textarea' : 'input';
      const inputProps = {
        ref: inputRef,
        className: clsx(styles.input, isClearable && styles.inputClearable),
        defaultValue: value,
        onBlur: handleCommit,
        onKeyDown: handleKeyDown,
        placeholder,
        'aria-label': `Editing text: ${value}`,
        disabled: readOnly,
      };

      return (
        <div className={styles.inputWrapper}>
          {React.createElement(InputComponent, inputProps)}
          {isClearable && (
            <button
              type="button"
              className={styles.clearButton}
              onMouseDown={handleClear}
              aria-label="Clear text"
            >
              <img src={crossIcon} alt="Clear" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={clsx(styles.display, className)}
        onClick={handleStartEdit}
        role="button"
        tabIndex={readOnly ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleStartEdit();
        }}
        aria-label={`Editable text: ${value}`}
      >
        {value ? value : <span className={styles.placeholder}>{placeholder}</span>}
      </div>
    );
  }
);

EditableText.displayName = 'EditableText';

export default EditableText;

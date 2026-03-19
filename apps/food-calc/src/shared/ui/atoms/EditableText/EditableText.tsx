import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import styles from './EditableText.module.scss';
import clsx from 'clsx';

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
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync local value with prop when not editing
    useEffect(() => {
      if (!isEditing) {
        setLocalValue(value);
      }
    }, [value, isEditing]);

    // Start editing
    const handleStartEdit = useCallback(() => {
      if (readOnly) return;
      setLocalValue(value);
      setIsEditing(true);
    }, [readOnly, value]);

    // Cancel editing
    const handleCancel = useCallback(() => {
      setLocalValue(value);
      setIsEditing(false);
    }, [value]);

    // Clear input
    const handleClear = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setLocalValue('');
      inputRef.current?.focus();
    }, []);

    // Commit changes
    const handleCommit = useCallback(() => {
      const trimmedValue = localValue.trim();
      if (!allowEmpty && !trimmedValue) {
        handleCancel();
      } else {
        setIsEditing(false);
        onChange(trimmedValue);
      }
    }, [localValue, allowEmpty, handleCancel, onChange]);

    // Handle key events
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          handleCommit();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        }
      },
      [multiline, handleCommit, handleCancel]
    );

    // Handle click outside
    useEffect(() => {
      if (!isEditing) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          handleCommit();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing, handleCommit]);

    // Focus input when entering edit mode
    useEffect(() => {
      if (isEditing) {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.setSelectionRange(
            inputRef.current.value.length,
            inputRef.current.value.length
          );
        }, 0);
      }
    }, [isEditing]);

    const showClearButton = isClearable && isEditing && localValue.length > 0;

    if (isEditing) {
      const InputComponent = multiline ? 'textarea' : 'input';
      const inputProps = {
        ref: inputRef,
        className: styles.input,
        value: localValue,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
          setLocalValue(e.target.value),
        onBlur: handleCommit,
        onKeyDown: handleKeyDown,
        placeholder,
        'aria-label': `Editing text: ${value}`,
        disabled: readOnly,
      };

      return (
        <div ref={containerRef} className={styles.inputWrapper}>
          {React.createElement(InputComponent, inputProps)}
          {showClearButton && (
            <button
              type="button"
              className={styles.clearButton}
              onMouseDown={handleClear}
              onClick={(e) => e.stopPropagation()}
              aria-label="Clear text"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        ref={(node) => {
          // Handle both refs
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={clsx(styles.display, className, { [styles.readOnly]: readOnly })}
        onClick={handleStartEdit}
        role="button"
        tabIndex={readOnly ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStartEdit();
          }
        }}
        aria-label={value ? `Editable text: ${value}. Click to edit.` : `Empty field. Click to add ${placeholder}.`}
      >
        <span className={styles.textContent}>
          {value || <span className={styles.placeholder}>{placeholder}</span>}
        </span>
        <span className={styles.editIcon}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 1.5L12.5 3.5L4 12H2V10L10.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    );
  }
);

EditableText.displayName = 'EditableText';

export default EditableText;

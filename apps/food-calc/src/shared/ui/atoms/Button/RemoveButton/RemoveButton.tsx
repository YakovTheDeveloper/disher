import React from 'react';
import clsx from 'clsx';
import s from './RemoveButton.module.css';
import CrossIcon from "@/assets/icons/cross.svg";

interface RemoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    size?: 'small' | 'medium' | 'large'; // Defines the allowed size variants
    color?: 'black' | 'gray' | 'white'
}

const RemoveButton: React.FC<RemoveButtonProps> = ({
    color = 'black',
    onClick, className, size = 'medium', ...props }) => {
    return (
        <button
            className={clsx(s.removeButton, s[size], className, s[color])}
            onClick={onClick}
            {...props} // Pass additional props (aria-label, disabled, etc.)
        >
            <CrossIcon />
        </button>
    );
}

export default RemoveButton;

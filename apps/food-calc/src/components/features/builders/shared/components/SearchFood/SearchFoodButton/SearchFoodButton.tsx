import React from 'react';
import s from './SearchFoodButton.module.scss';
import clsx from 'clsx';

export interface SearchFoodButtonProps {
  text?: string | null;
  placeholder?: string;
  onClick: () => void;
  topLeftAction?: React.ReactNode;
  topRightAction?: React.ReactNode;
  leftSlot?: React.ReactNode;
  rightSlots?: React.ReactNode;
  className?: string;
}

const SearchFoodButton: React.FC<SearchFoodButtonProps> = ({
  text,
  placeholder = 'Search food...',
  onClick,
  topLeftAction,
  topRightAction,
  leftSlot,
  rightSlots,
  className,
}) => {
  const hasTopBar = topLeftAction || topRightAction;
  const hasText = !!text;

  return (
    <div className={clsx(s.container, className)}>
      {hasTopBar && (
        <div className={s.topBar}>
          <div className={s.topLeft}>{topLeftAction}</div>
          <div className={s.topRight}>{topRightAction}</div>
        </div>
      )}
      <span className={clsx(s.button, hasText ? s.hasText : s.noText)} onClick={onClick}>
        {leftSlot && <div className={s.leftSlot}>{leftSlot}</div>}
        <span className={s.text}>{text || placeholder}</span>
        {rightSlots && <div className={s.rightSlots}>{rightSlots}</div>}
      </span>
    </div>
  );
};

export default SearchFoodButton;

import React from 'react';
import s from './SearchFoodButton.module.scss';
import clsx from 'clsx';
import Logo from '@/assets/icons/logo.svg';

export interface SearchFoodButtonProps {
  chosenFoodTitle?: string | null;
  placeholder?: string;
  onClick: () => void;
  onDetailClick?: () => void;
  topLeftAction?: React.ReactNode;
  topRightAction?: React.ReactNode;
  leftSlot?: React.ReactNode;
  rightSlots?: React.ReactNode;
  className?: string;
}

const SearchFoodButton: React.FC<SearchFoodButtonProps> = ({
  chosenFoodTitle,
  placeholder = 'Search food...',
  onClick,
  onDetailClick,
  topLeftAction,
  topRightAction,

  rightSlots,
  className,
}) => {
  const hasTopBar = topLeftAction || topRightAction;
  const hasText = !!chosenFoodTitle;

  return (
    <div className={clsx(s.container, className)}>
      <div className={s.topBar}>
        <div className={s.topLeft}>
          {onDetailClick && (
            <button className={s.detailButton} onClick={onDetailClick}>
              подробнее
            </button>
          )}
          {topLeftAction}
        </div>

        {/* <span className={s.logoSlot}>
          <Logo />
        </span> */}
        <div className={s.topRight}>{topRightAction}</div>
      </div>

      <span
        className={clsx(s.button, hasText ? s.hasText : s.noText)}
        role="button"
        tabIndex={0}
        onClick={onClick}
      >
        {!chosenFoodTitle && <span className={s.addIcon} />}
        <span className={s.chosenFoodTitle}>{chosenFoodTitle || placeholder}</span>
        {rightSlots && <div className={s.rightSlots}>{rightSlots}</div>}
      </span>
    </div>
  );
};

export default SearchFoodButton;

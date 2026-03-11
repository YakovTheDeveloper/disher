import React, { useState } from 'react';
import styles from './SearchFormExpandable.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

export interface SearchFormExpandableProps {
  trigger?: React.ReactNode;
  content: React.ReactNode;
  isExpanded: boolean;
  position?: 'fixed' | 'absolute';
}

const SearchFormExpandable: React.FC<SearchFormExpandableProps> = observer(
  ({ trigger, content, isExpanded, position = 'fixed' }) => {
    return (
      <div
        className={clsx(
          styles.container,
          position === 'fixed' && isExpanded && styles.fixed,
          position === 'absolute' && isExpanded && styles.absolute,
          isExpanded && styles.expanded
        )}
      >
        {trigger && (
          <label className={clsx(styles.trigger, isExpanded && styles.collapsed)} htmlFor="search">
            {trigger}
          </label>
        )}

        {<div className={clsx(styles.content, !isExpanded && styles.collapsed)}>{content}</div>}
      </div>
    );
  }
);

export default SearchFormExpandable;

import React, { useLayoutEffect, useRef } from 'react';
import styles from './GrowingInput.module.scss';
import { observer } from 'mobx-react-lite';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  maxWidth?: number;
  minWidth?: number;
  extraWidth?: number;
};

export const GrowingInput = ({
  value,
  maxWidth = 100,
  minWidth = 50,
  extraWidth = 16,
  style,
  ...props
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!mirrorRef.current || !inputRef.current) return;

    mirrorRef.current.textContent = String(value || ' ');
    const newWidth = mirrorRef.current.scrollWidth + extraWidth;

    const clampedWidth = Math.max(minWidth, maxWidth ? Math.min(newWidth, maxWidth) : newWidth);
    inputRef.current.style.width = `${clampedWidth}px`;
  }, [value, maxWidth, minWidth, extraWidth]);

  const { className, ...restProps } = props;

  return (
    <>
      <input
        {...restProps}
        ref={inputRef}
        value={value}
        className={`${styles.input} ${className || ''}`.trim()}
        style={{ ...style, maxWidth: '100%' }}
      />
      <span ref={mirrorRef} className={styles.hidden} />
    </>
  );
};

export default observer(GrowingInput);

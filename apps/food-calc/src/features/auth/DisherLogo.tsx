import type { CSSProperties } from 'react';
import styles from './DisherLogo.module.scss';

type Props = {
  className?: string;
  style?: CSSProperties;
};

/** Disher wordmark — raster logo from /logo/logo.png. */
export function DisherLogo({ className, style }: Props) {
  return (
    <img
      src="/logo/logo.png"
      alt="Disher"
      className={[styles.logo, className].filter(Boolean).join(' ')}
      style={style}
      draggable={false}
    />
  );
}

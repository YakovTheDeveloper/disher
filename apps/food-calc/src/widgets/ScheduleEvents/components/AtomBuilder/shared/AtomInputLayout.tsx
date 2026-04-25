/**
 * AtomInputLayout - Main layout wrapper for atom input blocks
 */

import React from 'react';
import { motion } from 'motion/react';
import styles from './AtomInputShared.module.css';

export interface AtomInputLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  accentColor?: string;
}

// Opacity + translate only — no height animation (height:auto is slow and janky)
const slideAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.14, ease: [0.4, 0, 0.2, 1] as const },
};

export const AtomInputLayout: React.FC<AtomInputLayoutProps> = ({
  title,
  description,
  children,
  accentColor,
}) => {
  return (
    <motion.div
      className={styles.inputBlock}
      style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
      {...slideAnimation}
    >
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </motion.div>
  );
};

AtomInputLayout.displayName = 'AtomInputLayout';

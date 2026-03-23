/**
 * AtomInputLayout - Main layout wrapper for atom input blocks
 */

import React from 'react';
import { motion } from 'framer-motion';
import styles from './AtomInputShared.module.css';

export interface AtomInputLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  accentColor?: string;
}

const slideDownAnimation = {
  initial: { opacity: 0, y: -10, height: 0 },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -10, height: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 25 },
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
      {...slideDownAnimation}
    >
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </motion.div>
  );
};

AtomInputLayout.displayName = 'AtomInputLayout';

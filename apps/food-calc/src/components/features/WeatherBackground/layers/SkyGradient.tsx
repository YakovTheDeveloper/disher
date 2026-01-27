import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from '../WeatherBackground.module.scss';

interface SkyGradientProps {
  colors: {
    top: string;
    middle: string;
    bottom: string;
    horizon: string;
  };
}

/**
 * Animated sky gradient layer
 * Creates smooth transitions between time periods using CSS radial/linear gradients
 * Multi-directional gradient for maximum aesthetic appeal and depth
 */
const SkyGradient: React.FC<SkyGradientProps> = ({ colors }) => {
  // Create a sophisticated multi-stop radial + linear gradient for depth and natural sky appearance
  // Combines multiple gradient directions for dimensional, artistic effect
  const gradientStyle = useMemo(
    () => ({
      background: `
        radial-gradient(
          ellipse at 50% 0%,
          ${colors.top} 0%,
          ${colors.middle} 35%,
          ${colors.horizon} 60%,
          ${colors.bottom} 100%
        ),
        linear-gradient(
          180deg,
          ${colors.top} 0%,
          ${colors.middle} 25%,
          ${colors.horizon} 65%,
          ${colors.bottom} 100%
        )
      `,
      backgroundAttachment: 'fixed',
    }),
    [colors]
  );

  return (
    <motion.div
      className={styles.skyGradient}
      animate={gradientStyle}
      transition={{
        duration: 1.2,
        ease: 'easeInOut',
      }}
    />
  );
};

export default SkyGradient;

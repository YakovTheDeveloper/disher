import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  parseTimeToHour,
  getTimePeriod,
  getTransitionProgress,
  getCurrentTimeString,
} from '@/lib/time/parseTime';
import { getAtmosphereColors, interpolateColor } from './constants/atmosphereColors';
import { useReducedMotion, useLowPowerDevice } from '@/hooks/usePerformanceOptimization';
import SkyGradient from './layers/SkyGradient';
import Clouds from './layers/Clouds';
import CelestialBodies from './layers/CelestialBodies';
import WeatherEffects, { type WeatherType } from './layers/WeatherEffects';
import styles from './WeatherBackground.module.scss';

export type { WeatherType };

export interface WeatherBackgroundProps {
  /** Time in 'HH:MM' format. If not provided, uses current browser time. Defaults to '12:00' */
  time?: string;
  /** Weather type to display */
  weatherType?: WeatherType;
  /** Additional CSS class */
  className?: string;
}

/**
 * Realistic animated atmospheric background
 * Displays time-based visual atmosphere (dawn/noon/sunset/night)
 * with animated sky gradients, clouds, celestial bodies, and weather effects
 *
 * Performance features:
 * - Respects prefers-reduced-motion
 * - Optimizes for low-power devices
 * - GPU-accelerated animations
 * - Efficient Canvas rendering
 */
const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  time,
  weatherType = 'clear',
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isLowPowerDevice = useLowPowerDevice();

  // Parse time or use current/default
  const timeString = time || getCurrentTimeString() || '12:00';
  const hour = parseTimeToHour(timeString) ?? 12;
  const timePeriod = getTimePeriod(hour);
  const transitionProgress = getTransitionProgress(hour);

  // Get colors for current and next period for smooth transitions
  const currentColors = useMemo(() => getAtmosphereColors(timePeriod), [timePeriod]);

  // Determine next period for transition blending
  const nextPeriod = useMemo(() => {
    const periods: Array<'night' | 'earlyMorning' | 'morning' | 'day' | 'evening'> = [
      'night',
      'earlyMorning',
      'morning',
      'day',
      'evening',
    ];
    const currentIndex = periods.indexOf(timePeriod);
    return periods[(currentIndex + 1) % periods.length];
  }, [timePeriod]);

  const nextColors = useMemo(() => getAtmosphereColors(nextPeriod), [nextPeriod]);

  // Blend colors for smooth transitions between periods
  const blendedColors = useMemo(
    () => ({
      sky: {
        top: interpolateColor(currentColors.sky.top, nextColors.sky.top, transitionProgress),
        middle: interpolateColor(
          currentColors.sky.middle,
          nextColors.sky.middle,
          transitionProgress
        ),
        bottom: interpolateColor(
          currentColors.sky.bottom,
          nextColors.sky.bottom,
          transitionProgress
        ),
        horizon: interpolateColor(
          currentColors.sky.horizon,
          nextColors.sky.horizon,
          transitionProgress
        ),
      },
      stars: {
        opacity:
          currentColors.stars.opacity +
          (nextColors.stars.opacity - currentColors.stars.opacity) * transitionProgress,
      },
    }),
    [currentColors, nextColors, transitionProgress]
  );

  // Animation duration based on performance preferences
  const animationDuration = prefersReducedMotion ? 0.01 : isLowPowerDevice ? 1.2 : 0.8;

  return (
    <motion.div
      ref={containerRef}
      className={`${styles.weatherBackground} ${className || ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: animationDuration,
        ease: 'easeInOut',
      }}
      style={{
        // CSS optimization hints
        contain: 'layout style paint',
      }}
    >
      {/* Sky gradient base layer */}
      {/* <SkyGradient colors={blendedColors.sky} /> */}

      {/* Clouds with parallax layers */}
      {/* <Clouds
        timePeriod={timePeriod}
        transitionProgress={transitionProgress}
        isReduced={prefersReducedMotion}
        isLowPower={isLowPowerDevice}
      /> */}

      {/* Sun/Moon and stars */}
      {/* <CelestialBodies
        hour={hour}
        timePeriod={timePeriod}
        starsOpacity={blendedColors.stars.opacity}
        isReduced={prefersReducedMotion}
      /> */}

      {/* Weather effects (rain, snow, fog) */}
      {/* <WeatherEffects
        weatherType={weatherType}
        timePeriod={timePeriod}
        isReduced={prefersReducedMotion}
        isLowPower={isLowPowerDevice}
      /> */}
    </motion.div>
  );
};

export default WeatherBackground;

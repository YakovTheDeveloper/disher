import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../WeatherBackground.module.scss';
import type { AtmospherePeriod } from '../constants/atmosphereColors';

export type WeatherType = 'clear' | 'cloudy' | 'rainy' | 'snowy';

interface WeatherEffectsProps {
  weatherType: WeatherType;
  timePeriod: AtmospherePeriod;
  isReduced?: boolean;
  isLowPower?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/**
 * Weather effects system with support for:
 * - Rain (diagonal particles with motion blur)
 * - Snow (slow falling particles with drift)
 * - Clear (no effects)
 */
const WeatherEffects: React.FC<WeatherEffectsProps> = ({
  weatherType,
  timePeriod,
  isReduced = false,
  isLowPower = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const [isActive, setIsActive] = useState(weatherType !== 'clear');

  // Effect intensity varies by time of day
  const getEffectIntensity = () => {
    return {
      night: 0.5,
      earlyMorning: 0.65,
      morning: 0.7,
      day: 0.6,
      evening: 0.8,
    }[timePeriod];
  };

  useEffect(() => {
    setIsActive(weatherType !== 'clear');
  }, [weatherType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to parent size
    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas.parentElement!);

    // Initialize particles
    const initializeParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 2000);

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          vx: 0,
          vy: 0,
          life: Math.random(),
        });
      }
    };

    initializeParticles();

    let frameCount = 0;

    const animate = () => {
      // Skip frames on low-power devices
      if (isLowPower && frameCount % 2 !== 0) {
        frameCount++;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      frameCount++;
      timeRef.current += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const intensity = getEffectIntensity();

      if (weatherType === 'rainy') {
        // Rain effect: fast diagonal particles
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
        ctx.lineWidth = 2;

        particlesRef.current.forEach((particle) => {
          particle.y += 8;
          particle.x += 2; // Diagonal wind

          // Recycle particle
          if (particle.y > canvas.height) {
            particle.y = -10;
            particle.x = Math.random() * canvas.width;
          }

          // Draw rain streak
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - 1, particle.y - 10);
          ctx.stroke();
        });

        ctx.globalAlpha = 1;
      } else if (weatherType === 'snowy') {
        // Snow effect: slow falling particles with drift
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.globalAlpha = 0.7;

        particlesRef.current.forEach((particle) => {
          particle.y += 0.8;
          particle.x += Math.sin(timeRef.current * 0.01 + particle.x * 0.01) * 0.5;

          // Recycle particle
          if (particle.y > canvas.height) {
            particle.y = -10;
            particle.x = Math.random() * canvas.width;
          }

          // Draw snowflake (simple circle)
          ctx.beginPath();
          ctx.arc(
            particle.x,
            particle.y,
            2 + Math.sin(timeRef.current * 0.01) * 0.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });

        ctx.globalAlpha = 1;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [weatherType, timePeriod, isActive, isReduced, isLowPower]);

  if (!isActive) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.canvas
        ref={canvasRef}
        className={styles.weatherEffectsLayer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: isReduced ? 0.01 : 0.8 }}
      />
    </AnimatePresence>
  );
};

export default WeatherEffects;

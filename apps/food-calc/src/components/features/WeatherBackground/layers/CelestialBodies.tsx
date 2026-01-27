import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../WeatherBackground.module.scss';
import type { AtmospherePeriod } from '../constants/atmosphereColors';

interface CelestialBodiesProps {
  hour: number;
  timePeriod: AtmospherePeriod;
  starsOpacity: number;
  isReduced?: boolean;
}

interface Star {
  x: number;
  y: number;
  brightness: number;
  size: number;
  twinkleSpeed: number;
}

/**
 * Celestial bodies layer with:
 * - Animated sun/moon positioned based on time
 * - Star field with subtle twinkling
 * - Realistic positioning across viewport
 */
const CelestialBodies: React.FC<CelestialBodiesProps> = ({
  hour,
  starsOpacity,
  isReduced = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Generate stars only once
  const generateStars = (width: number, height: number): Star[] => {
    const starCount = Math.floor((width * height) / 15000); // Density-based
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.6), // Stars only in upper portion
        brightness: 0.3 + Math.random() * 0.7,
        size: 0.5 + Math.random() * 1.5,
        twinkleSpeed: 0.01 + Math.random() * 0.03,
      });
    }

    return stars;
  };

  // Calculate sun/moon position (arc across sky)
  const getSunPosition = (hour: number, width: number, height: number) => {
    const normalizedHour = hour % 24;
    let visible = false;
    let progress = 0;

    // Sunrise: 5-7 hours
    if (normalizedHour >= 5 && normalizedHour < 7) {
      visible = true;
      progress = (normalizedHour - 5) / 2;
    }
    // Daytime: 7-18 hours
    else if (normalizedHour >= 7 && normalizedHour < 18) {
      visible = true;
      progress = (normalizedHour - 5) / 13;
    }
    // Sunset: 18-20 hours
    else if (normalizedHour >= 18 && normalizedHour < 20) {
      visible = true;
      progress = (normalizedHour - 5) / 15;
    }

    if (!visible) {
      return { x: -100, y: -100, visible: false };
    }

    // Arc path: left-bottom to right-bottom
    const x = width * progress;
    const arcHeight = height * 0.7;
    const y = height - arcHeight * Math.sin(progress * Math.PI);

    return { x, y, visible };
  };

  // Calculate moon position (opposite arc)
  const getMoonPosition = (hour: number, width: number, height: number) => {
    const normalizedHour = hour % 24;
    let visible = false;
    let progress = 0;

    // Moon visible 20-5 (night hours)
    if (normalizedHour >= 20 || normalizedHour < 5) {
      visible = true;
      // Map 20-5 to 0-1
      progress = normalizedHour >= 20 ? (normalizedHour - 20) / 9 : (normalizedHour + 24 - 20) / 9;
    }

    if (!visible) {
      return { x: -100, y: -100, visible: false };
    }

    // Arc path: right-top to left-top
    const x = width * (1 - progress);
    const arcHeight = height * 0.6;
    const y = height * 0.15 + arcHeight * Math.sin(progress * Math.PI);

    return { x, y, visible };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to parent size
    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      // Generate stars once per resize
      starsRef.current = generateStars(canvas.width, canvas.height);
    };
    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas.parentElement!);

    const animate = () => {
      timeRef.current += 1;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars with twinkling
      if (starsOpacity > 0.05) {
        ctx.globalAlpha = starsOpacity;
        starsRef.current.forEach((star) => {
          // Subtle twinkling animation
          const twinkle = 0.5 + 0.5 * Math.sin(timeRef.current * star.twinkleSpeed);
          const brightness = star.brightness * twinkle;

          ctx.fillStyle = `rgba(200, 220, 255, ${brightness})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();

          // Add subtle glow to brighter stars
          if (brightness > 0.7) {
            ctx.fillStyle = `rgba(200, 220, 255, ${brightness * 0.3})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;
      }

      // Draw sun
      const sunPos = getSunPosition(hour, canvas.width, canvas.height);
      if (sunPos.visible) {
        const sunRadius = 40;

        // Sun glow
        const sunGlow = ctx.createRadialGradient(
          sunPos.x,
          sunPos.y,
          0,
          sunPos.x,
          sunPos.y,
          sunRadius * 2
        );
        sunGlow.addColorStop(0, 'rgba(255, 200, 80, 0.3)');
        sunGlow.addColorStop(1, 'rgba(255, 150, 50, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunPos.x, sunPos.y, sunRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Sun disk
        const sunGradient = ctx.createRadialGradient(
          sunPos.x - 10,
          sunPos.y - 10,
          0,
          sunPos.x,
          sunPos.y,
          sunRadius
        );
        sunGradient.addColorStop(0, 'rgb(255, 240, 100)');
        sunGradient.addColorStop(1, 'rgb(255, 180, 50)');
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunPos.x, sunPos.y, sunRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw moon
      const moonPos = getMoonPosition(hour, canvas.width, canvas.height);
      if (moonPos.visible) {
        const moonRadius = 35;

        // Moon glow
        const moonGlow = ctx.createRadialGradient(
          moonPos.x,
          moonPos.y,
          0,
          moonPos.x,
          moonPos.y,
          moonRadius * 2
        );
        moonGlow.addColorStop(0, 'rgba(200, 200, 180, 0.2)');
        moonGlow.addColorStop(1, 'rgba(200, 200, 180, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonPos.x, moonPos.y, moonRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Moon disk with craters
        ctx.fillStyle = 'rgb(230, 230, 220)';
        ctx.beginPath();
        ctx.arc(moonPos.x, moonPos.y, moonRadius, 0, Math.PI * 2);
        ctx.fill();

        // Moon craters (shadow detail)
        ctx.fillStyle = 'rgba(150, 150, 140, 0.4)';
        ctx.beginPath();
        ctx.arc(moonPos.x - 8, moonPos.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonPos.x + 10, moonPos.y + 5, 3, 0, Math.PI * 2);
        ctx.fill();
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
  }, [hour, starsOpacity, isReduced]);

  return (
    <motion.canvas
      ref={canvasRef}
      className={styles.celestialLayer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: isReduced ? 0.01 : 1.2 }}
    />
  );
};

export default CelestialBodies;

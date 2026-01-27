import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../WeatherBackground.module.scss';
import type { AtmospherePeriod } from '../constants/atmosphereColors';

interface CloudsProps {
  timePeriod: AtmospherePeriod;
  transitionProgress?: number;
  isReduced?: boolean;
  isLowPower?: boolean;
}

/**
 * Multi-layered cloud system with parallax effect
 * Uses Canvas 2D for smooth, performance-optimized rendering
 * Respects prefers-reduced-motion and low-power device settings
 */
const Clouds: React.FC<CloudsProps> = ({ timePeriod, isReduced = false, isLowPower = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Cloud opacity varies by time of day
  const cloudOpacity = {
    dawn: 0.8,
    noon: 0.6,
    sunset: 0.9,
    night: 0.3,
  };

  // Reduce particle count on low-power devices
  const layerCount = isLowPower ? 2 : 3;

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
    };
    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas.parentElement!);

    // Draw soft cloud with multiple circles (cumulus style)
    const drawCloud = (
      x: number,
      y: number,
      scale: number,
      opacity: number,
      ctx: CanvasRenderingContext2D
    ) => {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

      // Multiple circles create natural cloud shape
      const circles = [
        { x: 0, y: 0, r: scale * 1.2 },
        { x: scale * 0.7, y: -scale * 0.3, r: scale * 0.9 },
        { x: -scale * 0.7, y: -scale * 0.3, r: scale * 0.9 },
        { x: scale * 0.35, y: scale * 0.3, r: scale * 0.7 },
        { x: -scale * 0.35, y: scale * 0.3, r: scale * 0.7 },
      ];

      circles.forEach((circle) => {
        ctx.beginPath();
        ctx.arc(x + circle.x, y + circle.y, circle.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    let frameCount = 0;

    const animate = () => {
      // Skip frames on low-power devices for smoother CPU usage
      if (isLowPower && frameCount % 2 !== 0) {
        frameCount++;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      frameCount++;

      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isReduced) {
        timeRef.current += 0.5;
      }

      // Three cloud layers with different speeds (or 2 on low-power devices)
      const baseLayers = [
        {
          speed: 0.3,
          opacity: cloudOpacity[timePeriod] * 0.6,
          scale: 60,
          yOffset: canvas.height * 0.15,
          count: 5,
        },
        {
          speed: 0.15,
          opacity: cloudOpacity[timePeriod] * 0.5,
          scale: 80,
          yOffset: canvas.height * 0.35,
          count: 4,
        },
        {
          speed: 0.05,
          opacity: cloudOpacity[timePeriod] * 0.3,
          scale: 100,
          yOffset: canvas.height * 0.55,
          count: 3,
        },
      ];

      const layers = baseLayers.slice(0, layerCount);

      layers.forEach((layer) => {
        for (let i = 0; i < layer.count; i++) {
          const baseX = (canvas.width / layer.count) * i + 100;
          const xOffset = ((timeRef.current * layer.speed) % (canvas.width + 200)) - 100;
          const x = baseX + xOffset;
          const y = layer.yOffset + Math.sin(i * 0.5) * 20;

          // Slight scale variation
          const scale = layer.scale * (0.8 + Math.sin(i) * 0.2);
          drawCloud(x, y, scale, layer.opacity, ctx);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [timePeriod, cloudOpacity, isReduced, isLowPower, layerCount]);

  return (
    <motion.canvas
      ref={canvasRef}
      className={styles.cloudsLayer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: isReduced ? 0.01 : 1 }}
    />
  );
};

export default Clouds;

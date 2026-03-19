import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import styles from './SliderFieldV2.module.scss';

interface SineWaveSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  width?: number | string;
  height?: number;
  color?: string;
  className?: string;
}

interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  sprite: PIXI.Sprite | null;
}

interface RippleData {
  x: number;
  y: number;
  progress: number;
  graphics: PIXI.Graphics;
}

function SliderFieldV2({
  min = 1,
  max = 10,
  step = 1,
  value,
  onChange,
  width = '100%',
  height = 100,
  color = '#2a75f5',
  className = '',
}: SineWaveSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerWidthRef = useRef(600); // Only use ref, no state

  // Refs for animation (no state for performance)
  const particlesRef = useRef<ParticleData[]>([]);
  const ripplesRef = useRef<RippleData[]>([]);
  const appRef = useRef<PIXI.Application | null>(null);
  const particleTextureRef = useRef<PIXI.Texture | null>(null);
  const prevValueRef = useRef(value);
  const parallaxRef = useRef({ x: 0, y: 0 });
  const isInitializedRef = useRef(false);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create particle texture
  const createParticleTexture = useCallback((app: PIXI.Application) => {
    const graphics = new PIXI.Graphics();
    graphics.circle(0, 0, 8);
    graphics.fill({ color: 0xffffff });
    return app.renderer.generateTexture(graphics);
  }, []);

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application();
    appRef.current = app;
    let cleanupCalled = false;

    async function initPixi() {
      try {
        await app.init({
          canvas: canvasRef.current!,
          width: containerWidthRef.current,
          height,
          backgroundAlpha: 0,
          eventMode: 'none',
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (cleanupCalled) {
          app.destroy(true, { children: true, texture: true });
          return;
        }

        isInitializedRef.current = true;

        // Particle texture
        particleTextureRef.current = createParticleTexture(app);

        // Animation loop
        app.ticker.add(() => {
          const dt = app.ticker.deltaTime;

          // Update particles
          particlesRef.current = particlesRef.current.filter((p) => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= 0.02 * dt;

            if (p.life > 0 && p.sprite) {
              p.sprite.x = p.x;
              p.sprite.y = p.y;
              p.sprite.alpha = p.life;
              p.sprite.scale.set(p.life * 0.5);
              return true;
            } else {
              if (p.sprite) {
                p.sprite.destroy();
              }
              return false;
            }
          });

          // Update ripple
          ripplesRef.current = ripplesRef.current.filter((r) => {
            r.progress += 0.02 * dt;

            if (r.progress < 1) {
              const radius = r.progress * 80;
              const opacity = 1 - r.progress;

              r.graphics.clear();

              // Secondary ripple (turquoise)
              r.graphics.circle(r.x, r.y, radius);
              r.graphics.stroke({ width: 2, color: 0x00ffc8, alpha: opacity });

              // Primary ripple (purple)
              r.graphics.circle(r.x, r.y, radius * 0.7);
              r.graphics.stroke({ width: 2, color: 0x3700ff, alpha: opacity });

              return true;
            } else {
              r.graphics.destroy();
              return false;
            }
          });
        });
      } catch (error) {
        console.error('PixiJS init error:', error);
      }
    }

    initPixi();

    return () => {
      cleanupCalled = true;
      isInitializedRef.current = false;
      clearTimeout(resizeTimeoutRef.current!);
      app.destroy(true, { children: true, texture: true });
    };
  }, [height, createParticleTexture]);

  // Update canvas size with debounced resize
  useEffect(() => {
    if (!containerRef.current || !appRef.current) return;

    const updateWidth = () => {
      if (!containerRef.current || !appRef.current || !isInitializedRef.current) return;

      clearTimeout(resizeTimeoutRef.current!);
      resizeTimeoutRef.current = setTimeout(() => {
        if (!containerRef.current || !appRef.current) return;

        const newWidth = containerRef.current.offsetWidth;
        if (containerWidthRef.current !== newWidth) {
          containerWidthRef.current = newWidth;
          appRef.current!.renderer.resize(newWidth, height);
        }
      }, 300);
    };

    // Single ResizeObserver (remove window resize listener to avoid conflict)
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);

    return () => {
      clearTimeout(resizeTimeoutRef.current!);
      observer.disconnect();
    };
  }, [height]);

  // Create particles (ref-based, no state)
  const createParticles = useCallback((x: number, y: number) => {
    const app = appRef.current;
    if (!app || !particleTextureRef.current) return;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;

      const sprite = new PIXI.Sprite(particleTextureRef.current);
      sprite.anchor.set(0.5);
      sprite.tint = Math.random() > 0.5 ? 0x3700ff : 0x00ffc8;
      sprite.x = x;
      sprite.y = y;

      app.stage.addChild(sprite);

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        sprite,
      });
    }
  }, []);

  // Create ripple (ref-based)
  const createRipple = useCallback((x: number, y: number) => {
    const app = appRef.current;
    if (!app) return;

    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);

    ripplesRef.current.push({
      x,
      y,
      progress: 0,
      graphics,
    });
  }, []);

  const centerY = height / 2;
  const paddingX = 5;
  // Get actual width from ref in real-time, don't rely on state
  const effectiveWidth = containerWidthRef.current - paddingX * 2;
  const totalCycles = 10; // 10 peaks on screen (for decorative sine wave)
  const maxAmplitude = height / 2 - 25;
  const minAmplitude = maxAmplitude * 0.1;

  // Straight line position calculation
  const getPositionForValue = (val: number) => {
    const normalized = (val - min) / (max - min);
    const x = paddingX + normalized * effectiveWidth;
    return { x, y: centerY };
  };

  // Straight line track path
  const pathData = useMemo(() => {
    if (effectiveWidth <= 0) return '';
    const startX = paddingX;
    const endX = paddingX + effectiveWidth;
    return `M ${startX},${centerY} L ${endX},${centerY}`;
  }, [effectiveWidth, centerY, paddingX]);

  // Decorative sine wave path (background)
  const decorativePathData = useMemo(() => {
    if (effectiveWidth <= 0) return '';

    const points = [];
    const segments = Math.max(100, Math.ceil(effectiveWidth / 3)); // Dynamic: ~1 point per 3px
    const twoPi = 2 * Math.PI;
    const amplitudeDiff = maxAmplitude - minAmplitude;
    const angleOffset = Math.PI / 2;
    const cycleFactor = totalCycles * twoPi;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = paddingX + t * effectiveWidth;
      const currentAmplitude = minAmplitude + t * amplitudeDiff;
      const angle = angleOffset + t * cycleFactor;
      const y = centerY - currentAmplitude * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    return `M ${points[0]} L ${points.slice(1).join(' ')}`;
  }, [effectiveWidth, centerY, minAmplitude, maxAmplitude, totalCycles, paddingX]);

  const ticks = useMemo(() => {
    const tickData = [];
    const count = Math.floor((max - min) / step);

    for (let i = 0; i <= count; i++) {
      const val = min + i * step;
      if (val > max) break;
      const pos = getPositionForValue(val);
      tickData.push({ val, ...pos });
    }
    return tickData;
  }, [min, max, step, effectiveWidth, paddingX]);

  const thumbPos = getPositionForValue(value);

  // Convert SVG viewBox coordinates to actual canvas pixel coordinates
  const getCanvasCoordinates = useCallback(
    (svgX: number, svgY: number) => {
      if (!containerRef.current) return { x: svgX, y: svgY };
      const rect = containerRef.current.getBoundingClientRect();
      const canvasX = (svgX / containerWidthRef.current) * rect.width;
      const canvasY = (svgY / height) * rect.height;
      return { x: canvasX, y: canvasY };
    },
    [height]
  );

  // Trigger effects when value changes (debounced to prevent particle spam)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const timer = setTimeout(() => {
        const canvasPos = getCanvasCoordinates(thumbPos.x, thumbPos.y);
        createRipple(canvasPos.x, canvasPos.y);
        createParticles(canvasPos.x, canvasPos.y);
      }, 0); // Use setTimeout to batch with next frame
      return () => clearTimeout(timer);
    }
  }, [value, thumbPos.x, thumbPos.y, createRipple, createParticles, getCanvasCoordinates]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Check if clicked on a tick point
    const target = e.target as SVGElement;
    if (target.tagName === 'circle' && target.parentElement?.tagName === 'g') {
      const gParent = target.parentElement as unknown as SVGElement;
      const valAttr = gParent.getAttribute('data-value');
      if (valAttr) {
        const tickValue = parseFloat(valAttr);
        onChange(tickValue);
        return;
      }
    }

    handlePointerMove(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Get actual rendered width and height
    const renderedWidth = rect.width;
    const renderedHeight = rect.height;

    // Transform screen coordinates to container-relative coordinates
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    // Transform from rendered coordinates to SVG viewBox coordinates
    // SVG viewBox is: 0 0 containerWidthRef.current height
    const svgX = (relativeX / renderedWidth) * containerWidthRef.current;

    // Parallax via CSS transforms (no React state)
    const centerX = renderedWidth / 2;
    const centerY = renderedHeight / 2;
    parallaxRef.current = {
      x: ((relativeX - centerX) / centerX) * 8,
      y: ((relativeY - centerY) / centerY) * 8,
    };

    // Apply parallax directly via style
    const textElement = containerRef.current.querySelector('.parallax-text') as HTMLElement;
    if (textElement) {
      textElement.style.transform = `translate3d(${parallaxRef.current.x}px, ${parallaxRef.current.y}px, 0)`;
    }

    const clampedX = Math.max(paddingX, Math.min(svgX, containerWidthRef.current - paddingX));
    const normalized = (clampedX - paddingX) / effectiveWidth;
    const rawValue = normalized * (max - min) + min;
    const steppedValue = Math.round(rawValue / step) * step;
    const finalValue = Math.max(min, Math.min(steppedValue, max));

    if (finalValue !== value) {
      onChange(finalValue);
    }
  };

  const handlePointerUp = () => {
    parallaxRef.current = { x: 0, y: 0 };
    const textElement = containerRef.current?.querySelector('.parallax-text') as HTMLElement;
    if (textElement) {
      textElement.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${styles.noSelect} ${styles.touchNone} ${className}`}
      style={{ width, height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* PixiJS Canvas for effects */}
      <canvas ref={canvasRef} className={styles.effectsCanvas} />

      {/* SVG layer for track and interactivity */}
      <svg
        width="100%"
        height="100%"
        className={styles.curvedSvg}
        viewBox={`0 0 ${containerWidthRef.current} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ cursor: 'pointer', position: 'relative', zIndex: 2, overflow: 'hidden' }}
      >
        {/* Decorative sine wave background */}
        <path
          d={decorativePathData}
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ opacity: 1, zIndex: 0 }}
        />

        {/* Main straight-line track */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          className={styles.fiftyOpacity}
        />

        {ticks.map((tick) => (
          <g key={tick.val} data-value={tick.val} style={{ cursor: 'pointer' }}>
            <circle cx={tick.x} cy={tick.y} r={3} fill={color} className={styles.eightyOpacity} />
          </g>
        ))}

        <circle
          cx={thumbPos.x}
          cy={thumbPos.y}
          r={10}
          fill="var(--color-accent)"
          stroke="white"
          strokeWidth={3}
          style={{
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
            transition: 'cx 0.05s ease-out, cy 0.05s ease-out',
          }}
        />
      </svg>

      {/* Text with pulse and parallax */}
      <div className={`parallax-text ${styles.pulsingText}`}>{value}</div>
    </div>
  );
}

export default SliderFieldV2;

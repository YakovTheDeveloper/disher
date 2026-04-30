import { createElement, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './ChangeHighlight.module.scss';

type Variant = 'ripple' | 'sweep';

type Props = {
  trigger: unknown;
  children: React.ReactNode;
  as?: 'span' | 'div' | 'label' | 'p';
  htmlFor?: string;
  className?: string;
  contentClassName?: string;
  onClick?: React.MouseEventHandler;
  variant?: Variant | Variant[];
};

const rippleKeyframes: Keyframe[] = [
  { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
  { transform: 'translate(-50%, -50%) scale(0.85)', opacity: 0.25, offset: 0.08 },
  { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.6, offset: 0.2 },
  { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.25, offset: 0.7 },
  { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
];

const rippleTiming: KeyframeAnimationOptions = {
  duration: 2000,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards',
};

const sweepKeyframes: Keyframe[] = [
  { backgroundPosition: '-120% 0', opacity: 0 },
  { opacity: 1, offset: 0.15 },
  { opacity: 1, offset: 0.85 },
  { backgroundPosition: '120% 0', opacity: 0 },
];

const sweepTiming: KeyframeAnimationOptions = {
  duration: 1400,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  fill: 'forwards',
};

const textFlashKeyframes: Keyframe[] = [
  { color: 'inherit', letterSpacing: 'normal' },
  { color: 'rgb(70, 60, 200)', letterSpacing: '0.01em', offset: 0.4 },
  { color: 'inherit', letterSpacing: 'normal' },
];

const textFlashTiming: KeyframeAnimationOptions = {
  duration: 1400,
  easing: 'ease-out',
  fill: 'forwards',
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const ChangeHighlight = ({
  trigger,
  children,
  as: Tag = 'span',
  htmlFor,
  className,
  contentClassName,
  onClick,
  variant = 'ripple',
}: Props) => {
  const variants = Array.isArray(variant) ? variant : [variant];
  const hasRipple = variants.includes('ripple');
  const hasSweep = variants.includes('sweep');

  const hostRef = useRef<HTMLElement | null>(null);
  const rippleRef = useRef<HTMLSpanElement | null>(null);
  const sweepRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);

  const rippleAnimRef = useRef<Animation | null>(null);
  const sweepAnimRef = useRef<Animation | null>(null);
  const textFlashAnimRef = useRef<Animation | null>(null);

  const [prevTrigger, setPrevTrigger] = useState(trigger);

  useEffect(() => {
    if (Object.is(prevTrigger, trigger)) return;
    setPrevTrigger(trigger);

    if (prefersReducedMotion()) return;

    if (hasRipple && rippleRef.current) {
      rippleAnimRef.current?.cancel();
      const anim = rippleRef.current.animate(rippleKeyframes, rippleTiming);
      rippleAnimRef.current = anim;
      hostRef.current?.classList.add(styles.hostAnimating);
      anim.onfinish = () => hostRef.current?.classList.remove(styles.hostAnimating);
      anim.oncancel = () => hostRef.current?.classList.remove(styles.hostAnimating);
    }

    if (hasSweep && sweepRef.current) {
      sweepAnimRef.current?.cancel();
      const anim = sweepRef.current.animate(sweepKeyframes, sweepTiming);
      sweepAnimRef.current = anim;

      if (contentRef.current) {
        textFlashAnimRef.current?.cancel();
        textFlashAnimRef.current = contentRef.current.animate(textFlashKeyframes, textFlashTiming);
      }
    }
  }, [trigger, prevTrigger, hasRipple, hasSweep]);

  useEffect(() => {
    return () => {
      rippleAnimRef.current?.cancel();
      sweepAnimRef.current?.cancel();
      textFlashAnimRef.current?.cancel();
    };
  }, []);

  const extra = Tag === 'label' ? { htmlFor } : {};
  const hostClass = clsx(
    styles.host,
    hasSweep && styles.hostSweep,
    className,
  );

  return createElement(
    Tag,
    {
      ref: hostRef as never,
      className: hostClass,
      onClick,
      ...extra,
    },
    hasRipple ? (
      <span key="ripple" ref={rippleRef} className={styles.ripple} aria-hidden="true" />
    ) : null,
    hasSweep ? (
      <span key="sweep" ref={sweepRef} className={styles.sweep} aria-hidden="true" />
    ) : null,
    <span key="content" ref={contentRef} className={clsx(styles.content, contentClassName)}>
      {children}
    </span>,
  );
};

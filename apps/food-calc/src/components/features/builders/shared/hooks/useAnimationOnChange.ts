import { useEffect, useState } from 'react';

export function useAnimationOnChange<T>(value: T, duration = 300) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), duration);
    return () => clearTimeout(timeout);
  }, [value, duration]);

  const className = animate ? 'change-data-with-animation change-data-animation-appear' : 'change-data-with-animation'

  return className;
}
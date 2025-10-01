import { useEffect, useState } from 'react';

export function useAnimationOnChange<T>(value: T, duration = 300) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), duration);
    return () => clearTimeout(timeout);
  }, [value, duration]);

  const className = animate ? 'builder__with-animation builder__animation-appear' : 'builder__with-animation'

  return className;
}
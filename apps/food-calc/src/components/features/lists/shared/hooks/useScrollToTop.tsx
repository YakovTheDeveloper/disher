import { useEffect, useState, useCallback } from 'react';

const SCROLL_THRESHOLD_MULTIPLIER = 2;

export const useScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const screenHeight = window.innerHeight;
    const threshold = screenHeight * SCROLL_THRESHOLD_MULTIPLIER;

    // Show button only when scrolled more than 2 screens AND scrolling down
    const isScrollingDown = currentScrollY > lastScrollY;
    const isPastThreshold = currentScrollY > threshold;

    setIsVisible(isPastThreshold && isScrollingDown);
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initialize with current scroll position
    setLastScrollY(window.scrollY);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return { isVisible, scrollToTop };
};

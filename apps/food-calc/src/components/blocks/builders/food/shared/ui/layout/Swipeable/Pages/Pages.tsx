import { observer } from 'mobx-react-lite';
import styles from './Pages.module.scss';
import { useRef, useState, useEffect } from 'react';
type Props = {
  children: React.ReactNode[];
};

const Pages = ({ children }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showGradient, setShowGradient] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkScroll = () => {
      setShowGradient(el.scrollHeight > el.clientHeight);
    };

    checkScroll(); // run initially
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  return (
    <>
      {children.map((child, i) => (
        <div key={i} className={styles.page} style={{ flex: `0 0 ${100 / children.length}%` }}>
          {showGradient && <div className={styles.gradientOverlay} />}
          <div className={styles.pageContent}>
            {child} <div className={styles.offset}></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default observer(Pages);

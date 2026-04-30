import { useEffect, useState } from 'react';
import { copyDiagToClipboard, getDiagCount, subscribeDiag, clearDiag } from './diagLog';

// Tap once: copies the diagnostic log dump to clipboard and shows result.
// Long-press (>800ms): clears the buffer.
//
// Visible only in dev builds (gated by import.meta.env.DEV in mounting code).
export function DiagButton() {
  const [count, setCount] = useState(getDiagCount());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    return subscribeDiag(() => setCount(getDiagCount()));
  }, []);

  const onClick = async () => {
    const ok = await copyDiagToClipboard();
    setFeedback(ok ? `📋 copied (${count})` : '❌ copy failed');
    setTimeout(() => setFeedback(null), 1500);
  };

  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  const onPointerDown = () => {
    pressTimer = setTimeout(() => {
      clearDiag();
      setFeedback('🗑 cleared');
      setTimeout(() => setFeedback(null), 1000);
      pressTimer = null;
    }, 800);
  };
  const onPointerUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 99999,
        padding: '6px 10px',
        fontSize: 12,
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 6,
        cursor: 'pointer',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {feedback ?? `📋 diag (${count})`}
    </button>
  );
}

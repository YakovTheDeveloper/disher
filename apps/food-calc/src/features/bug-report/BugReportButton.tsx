import { useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import s from './BugReportButton.module.scss';

const API_BASE = `http://${window.location.hostname}:3100`;

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();

  const handleOpen = useCallback(() => {
    setOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setText('');
  }, []);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/bug-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          page: location.pathname + location.search,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Bug report sent');
      handleClose();
    } catch {
      toast.error('Failed to send bug report');
    } finally {
      setSending(false);
    }
  }, [text, sending, handleClose]);

  return (
    <>
      <button className={s.trigger} onClick={handleOpen} aria-label="Bug report" />
      {open && (
        <div className={s.overlay} onClick={handleClose}>
          <div className={s.dialog} onClick={(e) => e.stopPropagation()}>
            <p className={s.title}>Bug Report</p>
            <textarea
              ref={textareaRef}
              className={s.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe the bug..."
            />
            <div className={s.actions}>
              <button className={`${s.btn} ${s.btnClose}`} onClick={handleClose}>
                Close
              </button>
              <button
                className={`${s.btn} ${s.btnSend}`}
                onClick={handleSend}
                disabled={!text.trim() || sending}
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Text } from '@/shared/ui/atoms/Typography';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { getBugReportStatus } from '../api/listBugReports';
import s from './BugReportModal.module.scss';

// Re-fetch the board every 10s while this tab is open. The component only mounts
// when the Status tab is active (see BugReportModal), so the interval is scoped
// to the tab's visibility — no polling while the user is on Новый/Список.
const POLL_MS = 10_000;

// Read-only render of the backend-maintained status board (data/bug-reports/
// status.md). remark-gfm enables task lists / tables so `- [x]` renders as a
// checkbox. The dev edits the file on the backend; the app only displays it.
const BugReportStatus = () => {
  const [md, setMd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async (initial: boolean) => {
    if (inFlight.current) return; // don't overlap a slow request with a poll tick
    inFlight.current = true;
    if (initial) {
      setError(null);
      setMd(null); // spinner only on the first load / manual retry
    }
    try {
      const next = await getBugReportStatus();
      setMd(next);
      setError(null);
    } catch (e) {
      // Initial failure → error state. A failed *poll* keeps the last good
      // content on screen (a transient backend hiccup shouldn't blank it).
      if (initial) setError(e instanceof Error ? e.message : 'Не удалось загрузить');
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void load(true);
    const id = window.setInterval(() => {
      if (!document.hidden) void load(false);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  if (error) {
    return (
      <div className={s.listState}>
        <Text variant="hint" className={s.error}>
          {error}
        </Text>
        <button type="button" className={s.retry} onClick={() => void load(true)}>
          Повторить
        </button>
      </div>
    );
  }

  if (md === null) {
    return (
      <div className={s.listState} aria-live="polite">
        <Spinner size={20} />
        <span>Загружаю статус…</span>
      </div>
    );
  }

  return (
    <div className={s.statusMd}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  );
};

export default BugReportStatus;

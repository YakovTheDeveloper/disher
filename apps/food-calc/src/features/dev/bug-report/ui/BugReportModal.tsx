import { useEffect, useState } from 'react';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { Text } from '@/shared/ui/atoms/Typography';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { submitBugReport } from '../api/submitBugReport';
import s from './BugReportModal.module.scss';

export type BugReportModalProps = BaseModalProps<boolean> & {
  page: string;
  screenSize: string;
  userAgent: string;
  pwa: string;
  /** Resolves to the screenshot dataURL (or null). Pending → spinner. Never rejects. */
  screenshotPromise: Promise<string | null>;
};

const BugReportModal = ({
  onClose,
  page,
  screenSize,
  userAgent,
  pwa,
  screenshotPromise,
}: BugReportModalProps) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [shotLoading, setShotLoading] = useState(true);

  // Resolve the background capture into the thumbnail. captureScreenshot never
  // rejects (best-effort → null), so this only ever resolves.
  useEffect(() => {
    let alive = true;
    screenshotPromise
      .then((url) => {
        if (alive) setScreenshot(url);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setShotLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [screenshotPromise]);

  const canSend = text.trim().length > 0 && !busy;

  async function handleSubmit() {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      // Await the capture so the screenshot is included even when the user
      // submits before it resolved (instant once done; never rejects).
      const shot = await screenshotPromise;
      await submitBugReport({
        text: text.trim(),
        page,
        screenSize,
        userAgent,
        pwa,
        screenshot: shot ?? undefined,
      });
      onClose(true);
    } catch (e) {
      // Keep the modal open and the draft intact so the report can be retried
      // (the dev backend may simply not be running yet).
      setError(e instanceof Error ? e.message : 'Не удалось отправить');
      setBusy(false);
    }
  }

  return (
    <ModalLayout className={s.layout} a11yLabel="Баг-репорт">
      {/* Full-bleed screenshot underneath — contain, centred on a dark stage. */}
      <div className={s.shotArea}>
        {shotLoading ? (
          <div className={s.shotLoading} aria-live="polite">
            <Spinner size={20} />
            <span>Снимаю экран…</span>
          </div>
        ) : screenshot ? (
          <img className={s.shot} src={screenshot} alt="Скриншот текущего экрана" />
        ) : (
          <div className={s.shotMissing}>Скриншот не снялся</div>
        )}
      </div>

      {/* Floating top bar — route hint + the text/dictation field. */}
      <div className={s.topBar}>
        <Text variant="hint" className={s.route}>
          {page}
        </Text>
        <AutoGrowSearch
          className={s.input}
          value={text}
          onChange={setText}
          placeholder="Что не так? Шаги, ожидаемое, фактическое…"
          maxRows={6}
          collapseOnBlur={false}
        />
        {error && (
          <Text variant="hint" className={s.error}>
            {error}
          </Text>
        )}
      </div>

      {/* Floating bottom bar — actions, screenshot fills the gap between. */}
      <div className={s.bottomBar}>
        <button
          type="button"
          className={s.cancel}
          onClick={() => onClose(false)}
          disabled={busy}
        >
          Отмена
        </button>
        <button
          type="button"
          className={s.send}
          onClick={handleSubmit}
          disabled={!canSend}
        >
          {busy ? 'Отправка…' : 'Отправить'}
        </button>
      </div>
    </ModalLayout>
  );
};

export default BugReportModal;

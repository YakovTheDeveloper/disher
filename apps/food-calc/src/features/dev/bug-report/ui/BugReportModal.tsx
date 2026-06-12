import { useEffect, useState } from 'react';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { Text } from '@/shared/ui/atoms/Typography';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { submitBugReport } from '../api/submitBugReport';
import BugReportList from './BugReportList';
import BugReportStatus from './BugReportStatus';
import s from './BugReportModal.module.scss';

type Tab = 'new' | 'list' | 'status';

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
  const [tab, setTab] = useState<Tab>('new');
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
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

  const tabs = (
    <div className={s.tabs} role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'new'}
        className={tab === 'new' ? `${s.tab} ${s.tabActive}` : s.tab}
        onClick={() => setTab('new')}
      >
        Новый
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'list'}
        className={tab === 'list' ? `${s.tab} ${s.tabActive}` : s.tab}
        onClick={() => setTab('list')}
      >
        Список
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'status'}
        className={tab === 'status' ? `${s.tab} ${s.tabActive}` : s.tab}
        onClick={() => setTab('status')}
      >
        Статус
      </button>
    </div>
  );

  return (
    <ModalLayout className={s.layout} a11yLabel="Баг-репорт">
      {/* Close — pinned top-left, present on every tab. */}
      <button
        type="button"
        className={s.close}
        onClick={() => onClose(false)}
        disabled={busy}
        aria-label="Закрыть"
      >
        ✕
      </button>

      {/* Tabs — pinned top-right, same place across all tabs. */}
      {tabs}

      {tab === 'new' && (
        <div className={s.newView}>
          {/* Flow column: route + input on top, screenshot below, actions last.
              No overlap — each block owns its space. */}
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

          {/* Screenshot fills the remaining space. Tap to inspect fullscreen. */}
          <div className={s.shotArea}>
            {shotLoading ? (
              <div className={s.shotLoading} aria-live="polite">
                <Spinner size={20} />
                <span>Снимаю экран…</span>
              </div>
            ) : screenshot ? (
              <button
                type="button"
                className={s.shotBtn}
                onClick={() => setZoomSrc(screenshot)}
                aria-label="Открыть скриншот на весь экран"
              >
                <img
                  className={s.shot}
                  src={screenshot}
                  alt="Скриншот текущего экрана"
                />
                <span className={s.shotHint}>Тап — увеличить</span>
              </button>
            ) : (
              <div className={s.shotMissing}>Скриншот не снялся</div>
            )}
          </div>

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
        </div>
      )}

      {tab === 'list' && (
        <div className={s.listView}>
          <div className={s.listScroll}>
            <BugReportList onZoom={setZoomSrc} />
          </div>
        </div>
      )}

      {tab === 'status' && (
        <div className={s.listView}>
          <div className={s.listScroll}>
            <BugReportStatus />
          </div>
        </div>
      )}

      {zoomSrc && (
        <button
          type="button"
          className={s.zoom}
          onClick={() => setZoomSrc(null)}
          aria-label="Закрыть скриншот"
        >
          <img className={s.zoomImg} src={zoomSrc} alt="Скриншот" />
        </button>
      )}
    </ModalLayout>
  );
};

export default BugReportModal;

import { useCallback, useEffect, useState } from 'react';
import { Text } from '@/shared/ui/atoms/Typography';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import {
  listBugReports,
  deleteBugReport,
  bugReportImageUrl,
  type BugReportListItem,
} from '../api/listBugReports';
import s from './BugReportModal.module.scss';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  /** Open the screenshot fullscreen (shared with the «Новый» tab). */
  onZoom: (src: string) => void;
};

const BugReportList = ({ onZoom }: Props) => {
  const [items, setItems] = useState<BugReportListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // filename pending a confirm tap / mid-delete — drive the inline two-step.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setItems(null);
    listBugReports()
      .then(setItems)
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Не удалось загрузить'),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(filename: string) {
    setDeleting(filename);
    try {
      await deleteBugReport(filename);
      setItems((prev) => prev?.filter((r) => r.filename !== filename) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  }

  if (error) {
    return (
      <div className={s.listState}>
        <Text role="caption" className={s.error}>
          {error}
        </Text>
        <button type="button" className={s.retry} onClick={load}>
          Повторить
        </button>
      </div>
    );
  }

  if (!items) {
    return (
      <div className={s.listState} aria-live="polite">
        <Spinner size={20} />
        <span>Загружаю репорты…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={s.listState}>
        <span>Репортов пока нет</span>
      </div>
    );
  }

  return (
    <ul className={s.list}>
      {items.map((r) => {
        const shotUrl = r.screenshotFile
          ? bugReportImageUrl(r.screenshotFile)
          : null;
        const isConfirming = confirming === r.filename;
        const isDeleting = deleting === r.filename;
        return (
          <li key={r.filename} className={s.row}>
            {shotUrl ? (
              <button
                type="button"
                className={s.thumbBtn}
                onClick={() => onZoom(shotUrl)}
                aria-label="Открыть скриншот"
              >
                <img className={s.thumb} src={shotUrl} alt="" loading="lazy" />
              </button>
            ) : (
              <div className={s.thumbEmpty}>—</div>
            )}

            <div className={s.rowBody}>
              <p className={s.rowText}>{r.text}</p>
              <div className={s.rowMeta}>
                {r.page && <span className={s.rowPage}>{r.page}</span>}
                <span>{formatWhen(r.createdAt)}</span>
              </div>
            </div>

            {isConfirming ? (
              <div className={s.confirm}>
                <button
                  type="button"
                  className={s.confirmYes}
                  onClick={() => handleDelete(r.filename)}
                  disabled={isDeleting}
                >
                  {isDeleting ? '…' : 'Удалить?'}
                </button>
                <button
                  type="button"
                  className={s.confirmNo}
                  onClick={() => setConfirming(null)}
                  disabled={isDeleting}
                  aria-label="Отмена"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={s.del}
                onClick={() => setConfirming(r.filename)}
                aria-label="Удалить репорт"
              >
                🗑
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default BugReportList;

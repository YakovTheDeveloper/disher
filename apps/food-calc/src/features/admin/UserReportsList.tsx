import { useEffect, useState } from 'react';
import { Text } from '@/shared/ui/atoms/Typography';
import { Accordion } from '@/shared/ui/Accordion';
import { fetchUserReports, type UserReport } from '@/shared/lib/api/admin';
import styles from './UserReportsList.module.scss';

// «Репорты» tab of /admin — the прод-сток of «Сообщить о проблеме» (user_reports).
// Each report is an Accordion: the collapsed head answers «кто и когда», the body
// carries the full text + the client metadata that makes it reproducible.
// `query` is the shared search box (email / user id / текст репорта), applied
// server-side.

interface Props {
  query: string;
}

function timeOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UserReportsList({ query }: Props) {
  const [reports, setReports] = useState<UserReport[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setFailed(false);
    setReports(null);
    fetchUserReports({ q: query }, ac.signal)
      .then(setReports)
      .catch(() => {
        if (!ac.signal.aborted) setFailed(true);
      });
    return () => ac.abort();
  }, [query]);

  if (failed) {
    return (
      <div className={styles.list}>
        <Text role="caption" as="p" className={styles.hint}>
          Не удалось загрузить репорты
        </Text>
      </div>
    );
  }

  if (reports === null) {
    return (
      <div className={styles.list}>
        <Text role="caption" as="p" className={styles.hint}>
          …
        </Text>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className={styles.list}>
        <Text role="caption" as="p" className={styles.hint}>
          Репортов нет
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {reports.map((report) => (
        <Accordion
          key={report.id}
          className={styles.row}
          headerClassName={styles.head}
          title={
            <span className={styles.identity}>
              <Text role="body" as="span" className={styles.who}>
                {report.email ?? report.userId}
              </Text>
              <Text role="caption" as="span" className={styles.excerpt}>
                {report.text}
              </Text>
            </span>
          }
          trailing={
            <Text role="caption" as="span" className={styles.when}>
              {timeOf(report.createdAt)}
            </Text>
          }
        >
          <div className={styles.body}>
            <Text role="body" as="p" className={styles.text}>
              {report.text}
            </Text>
            <Text role="caption" as="p" className={styles.meta}>
              {[
                report.page,
                report.screenSize,
                report.pwa ? `PWA: ${report.pwa}` : null,
                report.userAgent,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </div>
        </Accordion>
      ))}
    </div>
  );
}

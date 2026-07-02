import { useEffect, useRef, useState } from 'react';
import { useRouteError } from 'react-router-dom';
import { reportError } from '@/shared/lib/errors/report';
import Heading from '@/shared/ui/atoms/Typography/Heading/Heading';
import Text from '@/shared/ui/atoms/Typography/Text/Text';
import styles from './RouteError.module.scss';

// react-router `errorElement` for the content layer. Catches a throw from ANY
// page route (render or the — currently absent — loaders). It sits in App's
// <Outlet/>, so the app chrome (Toaster / Modal+Drawer managers / AuthGate)
// stays mounted while the failed page is replaced by this recoverable fallback
// — a coarser net than the per-subtree FeatureErrorBoundary, finer than the
// root Sentry.ErrorBoundary that blanks everything.
export default function RouteError() {
  const error = useRouteError();
  const [refId, setRefId] = useState<string | null>(null);
  // Report exactly once per caught error (StrictMode double-invokes effects, so
  // guard on the error identity).
  const reportedFor = useRef<unknown>(null);

  useEffect(() => {
    if (reportedFor.current === error) return;
    reportedFor.current = error;
    setRefId(reportError('route', error).refId);
  }, [error]);

  return (
    <div className={styles.root} role="alert">
      <Heading role="title" className={styles.title}>
        Не удалось открыть раздел
      </Heading>
      <Text role="body" className={styles.body}>
        Что-то пошло не так при загрузке. Обновите страницу — данные на месте.
      </Text>
      <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
        <Text as="span" role="label">Обновить страницу</Text>
      </button>
      {refId && (
        <Text role="caption" className={styles.refId}>
          код: {refId}
        </Text>
      )}
    </div>
  );
}

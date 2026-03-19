import { useEffect } from 'react';
import { db } from '@/shared/lib/storage/db';

const ResetPage = () => {
  useEffect(() => {
    (async () => {
      try {
        await db.snapshots.clear();
      } catch {}
      localStorage.clear();
      window.location.replace('/');
    })();
  }, []);

  return null;
};

export default ResetPage;

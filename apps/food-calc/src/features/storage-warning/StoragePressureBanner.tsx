import { drawerStore } from '@/shared/ui/drawer-store';
import { ProfileDrawer } from '@/features/auth/ProfileDrawer';
import { useStoragePressure } from '@/shared/lib/storage/useStoragePressure';
import Text from '@/shared/ui/atoms/Typography/Text/Text';
import styles from './StoragePressureBanner.module.scss';

// Persistent banner shown while local storage is >90% full. IndexedDB starts
// dropping writes near the quota, so this warns EARLY and routes the user to
// Profile → Данные → «Скачать файл» (the ProfileDrawer owns the export) so they
// can offload before writes fail. Signal is text (WCAG «color-not-only»), and it
// renders null at rest so it never adds chrome when storage is fine.
export function StoragePressureBanner() {
  const underPressure = useStoragePressure();
  if (!underPressure) return null;

  return (
    <div className={styles.banner} role="status">
      <Text role="caption" className={styles.text}>
        Хранилище почти заполнено. Скачайте копию данных, чтобы ничего не потерять.
      </Text>
      <button
        type="button"
        className={styles.action}
        onClick={() => void drawerStore.show(ProfileDrawer, {}, { side: 'left' })}
      >
        <Text as="span" role="label">Открыть данные</Text>
      </button>
    </div>
  );
}

export default StoragePressureBanner;

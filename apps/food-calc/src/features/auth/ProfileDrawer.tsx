import { useAuthStore } from './auth-store';
import styles from './ProfileDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';

export function ProfileDrawer({ onClose }: BaseDrawerProps) {
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const initial = email ? email[0].toUpperCase() : '?';

  return (
    <DrawerLayout>
      <div className={styles.container}>
        <div className={styles.profileArea}>
          <div className={styles.avatar}>
            <span className={styles.avatarLetter}>{initial}</span>
          </div>
          <span className={styles.email}>{email}</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </DrawerLayout>
  );
}

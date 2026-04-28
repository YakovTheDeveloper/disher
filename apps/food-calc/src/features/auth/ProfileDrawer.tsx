import { useAuthStore } from './auth-store';
import styles from './ProfileDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';

export function ProfileDrawer({ onClose }: BaseDrawerProps) {
  const email = useAuthStore((s) => s.email);
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const initial = email ? email[0].toUpperCase() : '?';

  return (
    <DrawerLayout>
      <div className={styles.container}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <span className={styles.avatarLetter}>{initial}</span>
          </div>
          <h1 className={styles.heading}>Аккаунт</h1>
          <p className={styles.email}>{email}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </DrawerLayout>
  );
}

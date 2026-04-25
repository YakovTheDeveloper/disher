import { useAuthStore } from './auth-store';
import styles from './ProfileDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import { drawerStore } from '@/shared/ui/drawer-store';
import { AuthDrawer } from './AuthDrawer';

export function ProfileDrawer({ onClose }: BaseDrawerProps) {
  const email = useAuthStore((s) => s.email);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const openAuth = () => {
    onClose();
    drawerStore.show(AuthDrawer, {});
  };

  if (isAnonymous) {
    return (
      <DrawerLayout>
        <div className={styles.container}>
          <div className={styles.profileArea}>
            <div className={styles.avatar}>
              <span className={styles.avatarLetter}>?</span>
            </div>
            <span className={styles.email}>Анонимный режим</span>
            <p className={styles.hint}>
              Данные сохраняются только на этом устройстве. Создайте аккаунт,
              чтобы синхронизировать их между устройствами.
            </p>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={openAuth}>
              Сохранить данные
            </button>
          </div>
        </div>
      </DrawerLayout>
    );
  }

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

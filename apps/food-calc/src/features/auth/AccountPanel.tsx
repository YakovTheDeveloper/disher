import { useAuthStore } from './auth-store';
import styles from './AccountPanel.module.scss';
import { drawerStore } from '@/shared/ui/drawer-store';
import { AuthDrawer } from './AuthDrawer';
import { ProfileDrawer } from './ProfileDrawer';

const AccountPanel = () => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const email = useAuthStore((s) => s.email);

  const openDrawer = () => {
    if (isLoggedIn) {
      drawerStore.show(ProfileDrawer, {});
    } else {
      drawerStore.show(AuthDrawer, {});
    }
  };

  if (isLoggedIn) {
    return (
      <button className={styles.avatarButton} onClick={openDrawer} title={email ?? 'Аккаунт'}>
        <span className={styles.avatarLetter}>
          {email ? email[0].toUpperCase() : '?'}
        </span>
      </button>
    );
  }

  return (
    <button className={styles.loginTrigger} onClick={openDrawer}>
      Войти
    </button>
  );
};

export default AccountPanel;

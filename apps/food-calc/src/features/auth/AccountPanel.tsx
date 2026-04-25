import { useAuthStore } from './auth-store';
import styles from './AccountPanel.module.scss';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ProfileDrawer } from './ProfileDrawer';

const AccountPanel = () => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const email = useAuthStore((s) => s.email);

  const openDrawer = () => {
    drawerStore.show(ProfileDrawer, {});
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

  if (isAnonymous) {
    return (
      <button
        className={styles.avatarButton}
        onClick={openDrawer}
        title="Анонимный режим"
      >
        <span className={styles.avatarLetter}>?</span>
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

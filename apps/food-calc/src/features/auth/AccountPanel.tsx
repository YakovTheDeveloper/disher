import { useAuthStore } from './auth-store';
import styles from './AccountPanel.module.scss';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ProfileDrawer } from './ProfileDrawer';
import MoreIcon from '@/shared/assets/icons/more.svg?react';

const AccountPanel = () => {
  const email = useAuthStore((s) => s.email);

  const openDrawer = () => {
    drawerStore.show(ProfileDrawer, {}, { side: 'left' });
  };

  return (
    <button
      className={styles.avatarButton}
      onClick={openDrawer}
      aria-label={email ? `Настройки и аккаунт ${email}` : 'Настройки и аккаунт'}
    >
      <MoreIcon className={styles.icon} />
    </button>
  );
};

export default AccountPanel;

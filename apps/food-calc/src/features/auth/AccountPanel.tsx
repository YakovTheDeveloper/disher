import { useAuthStore } from './auth-store';
import styles from './AccountPanel.module.scss';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ProfileDrawer } from './ProfileDrawer';

const AccountPanel = () => {
  const email = useAuthStore((s) => s.email);

  // The app is gated behind AuthGate, so by the time AccountPanel renders the
  // user is always logged in. Defensive null-check kept for the brief window
  // after signOut when the gate re-mounts.

  const openDrawer = () => {
    // Account/settings is a global navigation surface, not a contextual action
    // sheet — it slides in from the side. Full viewport height fits the profile
    // + theme picker + danger zone without scrolling.
    drawerStore.show(ProfileDrawer, {}, { side: 'left' });
  };

  return (
    <button
      className={styles.avatarButton}
      onClick={openDrawer}
      aria-label={email ? `Аккаунт ${email}` : 'Аккаунт'}
    >
      <span className={styles.avatarLetter}>{email ? email[0].toUpperCase() : '?'}</span>
    </button>
  );
};

export default AccountPanel;

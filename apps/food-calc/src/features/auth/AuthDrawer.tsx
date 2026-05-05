import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import { AuthForm } from './AuthForm';
import { CheckInboxView } from './CheckInboxView';
import { useAuthStore } from './auth-store';

type Props = BaseDrawerProps & {
  initialMode?: 'signIn' | 'signUp';
};

export function AuthDrawer({ onClose, initialMode = 'signIn' }: Props) {
  const pendingEmail = useAuthStore((s) => s.pendingVerificationEmail);
  return (
    <DrawerLayout>
      {pendingEmail ? (
        <CheckInboxView email={pendingEmail} />
      ) : (
        <AuthForm initialMode={initialMode} onSuccess={onClose} />
      )}
    </DrawerLayout>
  );
}

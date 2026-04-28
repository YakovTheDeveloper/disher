import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import { AuthForm } from './AuthForm';

type Props = BaseDrawerProps & {
  initialMode?: 'signIn' | 'signUp';
};

export function AuthDrawer({ onClose, initialMode = 'signIn' }: Props) {
  return (
    <DrawerLayout>
      <AuthForm initialMode={initialMode} onSuccess={onClose} />
    </DrawerLayout>
  );
}

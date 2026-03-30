import toaster from '@/shared/lib/toaster/toaster';
import { logMutationError } from '@/shared/lib/mutationLog';

export function safeMutate<T>(
  fn: () => T,
  errorMessage = 'Не удалось сохранить',
): T | undefined {
  try {
    return fn();
  } catch (error) {
    console.error('[mutation error]', error);
    logMutationError(errorMessage, error);
    toaster.error(errorMessage);
    return undefined;
  }
}

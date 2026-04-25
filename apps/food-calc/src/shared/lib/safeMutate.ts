import toaster from '@/shared/lib/toaster/toaster';
import { logMutationError } from '@/shared/lib/mutationLog';

export async function safeMutate<T>(
  fn: () => T | Promise<T>,
  errorMessage = 'Не удалось сохранить',
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.error('[mutation error]', error);
    logMutationError(errorMessage, error);
    toaster.error(errorMessage);
    return undefined;
  }
}

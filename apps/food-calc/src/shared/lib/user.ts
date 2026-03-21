const SYSTEM_USER_ID = '__system__';

export function isCreatedByUser(userId: string | undefined | null): boolean {
  return !!userId && userId !== SYSTEM_USER_ID;
}

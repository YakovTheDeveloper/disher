export const SYSTEM_USER_ID = '__system__';
const AUTH_TOKEN_KEY = 'auth_token';
const ANON_USER_ID_KEY = 'anon_user_id';

export function isCreatedByUser(userId: string | undefined | null): boolean {
  return !!userId && userId !== SYSTEM_USER_ID;
}

export function getCurrentUserId(): string {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) return payload.sub;
    } catch { /* fall through */ }
  }
  return getAnonUserId();
}

export function getAnonUserId(): string {
  let id = localStorage.getItem(ANON_USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_USER_ID_KEY, id);
  }
  return id;
}

// fetch() with Authorization: Bearer <token> attached. Centralizes the
// "get the token, set the header" logic that was previously duplicated in
// backupClient + authHeaders.

import { authProvider } from '@/shared/lib/auth/authProvider';

export class NotAuthenticatedError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'NotAuthenticatedError';
  }
}

export async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await authProvider.getAccessToken();
  if (!token) throw new NotAuthenticatedError();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

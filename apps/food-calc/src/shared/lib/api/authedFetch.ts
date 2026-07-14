// fetch() that carries the session cookie.
//
// The session is an httpOnly cookie on the API's site, so there is nothing to
// attach by hand — `credentials: 'include'` tells the browser to send it on a
// cross-ORIGIN (but same-SITE) call to api.disher.life. An unauthenticated call
// now simply comes back 401 from the server, like any other failure.

export function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, credentials: 'include' });
}

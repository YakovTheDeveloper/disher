// URL-marker consumption for the OAuth redirect round-trip (Telegram). The
// error marker is the only state that survives leaving the SPA (the success leg
// needs none — the session comes home as a cookie), so the contract is strict:
// read once, strip from the address bar, never touch foreign params.
import { afterEach, describe, expect, it } from 'vitest';
import { consumeOAuthReturnError } from '../oauthReturn';

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('consumeOAuthReturnError', () => {
  it('returns null when neither error param is present', () => {
    expect(consumeOAuthReturnError()).toBeNull();
  });

  it('consumes the authError marker without a better-auth code', () => {
    window.history.replaceState(null, '', '/?authError=telegram');

    expect(consumeOAuthReturnError()).toEqual({ code: null });
    expect(window.location.search).toBe('');
  });

  it('extracts the better-auth code and strips both params, keeping foreign ones', () => {
    window.history.replaceState(null, '', '/?authError=telegram&error=state_mismatch&keep=1');

    expect(consumeOAuthReturnError()).toEqual({ code: 'state_mismatch' });
    expect(window.location.search).toBe('?keep=1');
  });

  it('reacts to a bare ?error= (onAPIError 302 to FRONTEND_ORIGIN, no marker)', () => {
    window.history.replaceState(null, '', '/?error=issuer_missing');

    expect(consumeOAuthReturnError()).toEqual({ code: 'issuer_missing' });
    expect(window.location.search).toBe('');
  });
});

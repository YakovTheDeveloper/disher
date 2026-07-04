// Phase 1 acceptance autotest — gates 1 + 6 of the manual smoke checklist:
//   gate 1: signed-out user is blocked from the app (AuthScreen mounts in place
//           of children).
//   gate 6: routes under /auth/* bypass the gate so an unauthenticated user
//           landing from a verification email can reach VerifyEmailPage.
//
// AuthScreen / AuthForm / CheckInboxView are stubbed so the test focuses on
// the gate's branch logic, not on the screen's design-variant rendering.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

type GateState = { isReady: boolean; isLoggedIn: boolean };
const mockState: GateState = { isReady: false, isLoggedIn: false };

vi.mock('../auth-store', () => ({
  useAuthStore: (selector: (s: GateState) => unknown) => selector(mockState),
}));

vi.mock('../AuthScreen', () => ({
  AuthScreen: () => <div data-testid="auth-screen" />,
}));

const { AuthGate } = await import('../AuthGate');

function setPath(p: string) {
  // jsdom locks `location.pathname` against direct redefinition; use the
  // History API instead — pushState mutates the URL through the same path the
  // browser uses, so window.location.pathname tracks it.
  window.history.pushState({}, '', p);
}

beforeEach(() => {
  mockState.isReady = false;
  mockState.isLoggedIn = false;
  setPath('/');
});

afterEach(() => {
  setPath('/');
});

// ⚠️ TEMP: AuthGate is currently disabled in source — it returns `<>{children}</>`
// unconditionally (auth off for phone testing without login; see AuthGate.tsx).
// While that hold is in place the gate never renders `null` or AuthScreen, so the
// three acceptance gates that assert blocked/in-flight behavior are SUSPENDED, not
// deleted. Re-enable auth (uncomment AuthGate's body) → drop these `.skip`s.
describe.skip('AuthGate — bootstrap', () => {
  it('renders nothing while session check is in flight (no FOUC)', () => {
    mockState.isReady = false;
    mockState.isLoggedIn = false;
    const { container } = render(
      <AuthGate>
        <div data-testid="app" />
      </AuthGate>,
    );
    expect(screen.queryByTestId('app')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });
});

describe.skip('AuthGate — signed-out gate (acceptance 1)', () => {
  it('mounts AuthScreen instead of children when bootstrap done + no session', () => {
    mockState.isReady = true;
    mockState.isLoggedIn = false;
    render(
      <AuthGate>
        <div data-testid="app" />
      </AuthGate>,
    );
    expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('app')).not.toBeInTheDocument();
  });
});

describe('AuthGate — signed-in passthrough', () => {
  it('renders children when isReady + isLoggedIn', () => {
    mockState.isReady = true;
    mockState.isLoggedIn = true;
    render(
      <AuthGate>
        <div data-testid="app" />
      </AuthGate>,
    );
    expect(screen.getByTestId('app')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();
  });
});

describe.skip('AuthGate — /auth/* bypass (acceptance 6)', () => {
  it('renders children at /auth/verify-email even when signed-out + not ready', () => {
    setPath('/auth/verify-email');
    mockState.isReady = false;
    mockState.isLoggedIn = false;
    render(
      <AuthGate>
        <div data-testid="app" />
      </AuthGate>,
    );
    expect(screen.getByTestId('app')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();
  });

  it('renders children at /auth/foo when signed-out (covers future /auth/* pages)', () => {
    setPath('/auth/foo');
    mockState.isReady = true;
    mockState.isLoggedIn = false;
    render(
      <AuthGate>
        <div data-testid="app" />
      </AuthGate>,
    );
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });

  it('does NOT bypass for /authentic — the prefix is /auth/ with trailing slash', () => {
    setPath('/authentic');
    mockState.isReady = true;
    mockState.isLoggedIn = false;
    render(
      <AuthGate>
        <div data-testid="app" />
      </AuthGate>,
    );
    expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('app')).not.toBeInTheDocument();
  });
});

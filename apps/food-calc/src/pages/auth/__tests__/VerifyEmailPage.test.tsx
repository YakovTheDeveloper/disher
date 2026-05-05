// C4 (negative + happy path) — VerifyEmailPage integration test.
//
// Drives the page through React Router with mocked authClient + auth-store
// to assert the user-facing copy + side effects line up:
//   - happy path: token in URL → verifyEmail success → "Готово" + clearPending
//                 + navigate('/') after the success delay.
//   - error path: verifyEmail returns { error } → "Ссылка не сработала" + the
//                 error message surfaces unchanged + clearPending NOT called.
//   - tampered/expired token (same as error path but simulates better-auth's
//                             actual response shape).
//   - no-token: URL has no ?token= → "Ссылка не содержит токен", verifyEmail
//                 is never called.
//
// We do NOT spin up the real auth-store nanostore subscription — the
// integration that auth-store flips isLoggedIn=true on a successful
// verifyEmail (via the better-auth session atom) is exercised by the
// auth-store unit tests. Here we only assert the page itself wires up
// correctly.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

const verifyEmailMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('@/shared/lib/auth/betterAuthClient', () => ({
  authClient: {
    verifyEmail: (...args: unknown[]) => verifyEmailMock(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const clearPendingMock = vi.fn();

// auth-store is consumed via a selector hook; mock just the selector slice
// the page reads.
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: (selector: (s: { clearPendingVerification: () => void }) => unknown) =>
    selector({ clearPendingVerification: clearPendingMock }),
}));

// SCSS modules — return any prop name as a class string.
vi.mock('@/features/auth/AuthScreen.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `auth-screen-${p}` }),
}));
vi.mock('@/features/auth/AuthForm.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `auth-form-${p}` }),
}));

import VerifyEmailPage from '../VerifyEmailPage';

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  verifyEmailMock.mockReset();
  navigateMock.mockReset();
  clearPendingMock.mockReset();
});

describe('VerifyEmailPage — happy path', () => {
  it('verifies token, clears pending, then navigates home after success delay', async () => {
    verifyEmailMock.mockResolvedValue({ error: null });

    renderAt('/auth/verify-email?token=jwt-good');

    await waitFor(() => {
      expect(verifyEmailMock).toHaveBeenCalledWith({
        query: { token: 'jwt-good' },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('heading')).toHaveTextContent('Готово');
    });
    expect(clearPendingMock).toHaveBeenCalledTimes(1);

    // The post-success redirect runs via setTimeout(1500ms). Wait for it.
    await waitFor(
      () => {
        expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
      },
      { timeout: 3000 },
    );
  });
});

describe('VerifyEmailPage — error paths', () => {
  it('renders the better-auth error message when verifyEmail returns { error }', async () => {
    verifyEmailMock.mockResolvedValue({
      error: { message: 'Token expired' },
    });

    renderAt('/auth/verify-email?token=jwt-expired');

    await waitFor(() => {
      expect(screen.getByRole('heading')).toHaveTextContent('Ссылка не сработала');
    });
    expect(screen.getByText('Token expired')).toBeInTheDocument();
    expect(clearPendingMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('falls back to a Russian default when the error has no message', async () => {
    verifyEmailMock.mockResolvedValue({
      error: { message: '' },
    });

    renderAt('/auth/verify-email?token=jwt-tampered');

    await waitFor(() => {
      expect(screen.getByRole('heading')).toHaveTextContent('Ссылка не сработала');
    });
    expect(
      screen.getByText(/Ссылка недействительна или истекла/),
    ).toBeInTheDocument();
  });

  it('handles a thrown network error (verifyEmail rejects) without crashing', async () => {
    verifyEmailMock.mockRejectedValue(new Error('network'));

    renderAt('/auth/verify-email?token=jwt-net');

    await waitFor(() => {
      expect(screen.getByRole('heading')).toHaveTextContent('Ссылка не сработала');
    });
    expect(screen.getByText('network')).toBeInTheDocument();
  });
});

describe('VerifyEmailPage — no-token branch', () => {
  it('shows the no-token copy without ever calling verifyEmail', async () => {
    renderAt('/auth/verify-email');

    expect(screen.getByRole('heading')).toHaveTextContent(/не содержит токен/);
    // Yield to let any pending microtasks fire.
    await Promise.resolve();
    expect(verifyEmailMock).not.toHaveBeenCalled();
    expect(clearPendingMock).not.toHaveBeenCalled();
  });
});

// Phase 1 acceptance autotest — gate 2 of the manual smoke checklist:
//   gate 2: a fresh signUp under requireEmailVerification leaves the user on
//           the "check your inbox" branch (CheckInboxView), NOT logged in.
//
// AuthScreen's job here is the if/else: pendingVerificationEmail set →
// CheckInboxView, else → AuthForm. Children + design-variant infra are
// stubbed so the test isolates the branch.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

type ScreenState = { pendingVerificationEmail: string | null };
const mockState: ScreenState = { pendingVerificationEmail: null };

vi.mock('../auth-store', () => ({
  useAuthStore: (selector: (s: ScreenState) => unknown) => selector(mockState),
}));

vi.mock('../AuthForm', () => ({
  AuthForm: ({ layout }: { layout?: string }) => (
    <div data-testid="auth-form" data-layout={layout ?? ''} />
  ),
}));

vi.mock('../CheckInboxView', () => ({
  CheckInboxView: ({ email, layout }: { email: string; layout?: string }) => (
    <div data-testid="check-inbox" data-email={email} data-layout={layout ?? ''} />
  ),
}));

vi.mock('../DisherLogo', () => ({
  DisherLogo: () => <div data-testid="logo" />,
}));

vi.mock('@/shared/lib/useDesignVariant', () => ({
  useDesignVariant: () => ({
    variant: 'v1-photo',
    anchor: { ref: () => {}, 'data-dv': 'AuthScreen', 'data-dv-v': 'v1-photo' },
  }),
}));

vi.mock('@/app/ui/DesignVariantsBar', () => ({
  shouldShowDvBar: () => false,
}));

// Sass module — Proxy returns the property name as a class string so any
// className lookup resolves without scss compilation.
vi.mock('../AuthScreen.module.scss', () => ({
  default: new Proxy(
    {},
    { get: (_t, p: string) => `auth-screen-${String(p)}` },
  ),
}));

const { AuthScreen } = await import('../AuthScreen');

beforeEach(() => {
  mockState.pendingVerificationEmail = null;
});

describe('AuthScreen', () => {
  it('renders AuthForm when there is no pending verification email', () => {
    render(<AuthScreen />);
    expect(screen.getByTestId('auth-form')).toBeInTheDocument();
    expect(screen.queryByTestId('check-inbox')).not.toBeInTheDocument();
  });

  it('renders CheckInboxView with the pending email (acceptance 2)', () => {
    mockState.pendingVerificationEmail = 'fresh@example.com';
    render(<AuthScreen />);
    const view = screen.getByTestId('check-inbox');
    expect(view).toBeInTheDocument();
    expect(view).toHaveAttribute('data-email', 'fresh@example.com');
    expect(screen.queryByTestId('auth-form')).not.toBeInTheDocument();
  });

  it('passes the variant layout (card for v1-photo) to the active subcomponent', () => {
    render(<AuthScreen />);
    // shouldShowDvBar() is mocked to false → variant locked to v1-photo,
    // whose LAYOUT_BY_VARIANT entry is 'card'.
    expect(screen.getByTestId('auth-form')).toHaveAttribute('data-layout', 'card');
  });
});

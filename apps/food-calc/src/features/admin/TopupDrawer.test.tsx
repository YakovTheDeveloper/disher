// @vitest-environment jsdom
// TopupDrawer — two invariants:
//  • ₽→kopeck conversion happens at the boundary with Math.round (1.5 ₽ → 150),
//    so no float ever reaches the API;
//  • the idempotency requestId is minted ONCE per drawer mount — NOT regenerated
//    on re-render — so a retry of the same form dedups server-side instead of
//    double-crediting.
// The api module is mocked; DrawerLayout + the two inputs are stubbed to plain
// controls so the form can be driven without base-ui / autogrow machinery.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

vi.mock('@/shared/lib/api/admin', () => ({ topupUser: vi.fn() }));
vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/shared/ui/atoms/input/NumberInput', () => ({
  NumberInput: ({ value, onChange }: { value: number; onChange?: (n: number) => void }) => (
    <input
      aria-label="amount"
      value={value}
      onChange={(e) => onChange?.(Number(e.target.value) || 0)}
    />
  ),
}));
vi.mock('@/shared/ui/atoms/input/AutoGrowSearch', () => ({
  AutoGrowSearch: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="reason" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock('./TopupDrawer.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `td-${String(p)}` }),
}));

import { topupUser } from '@/shared/lib/api/admin';
import { rubToKop } from '@/shared/lib/money';
import { TopupDrawer } from './TopupDrawer';

const mockTopup = vi.mocked(topupUser);

beforeEach(() => {
  mockTopup.mockReset();
});

describe('rubToKop (₽→kopeck boundary)', () => {
  it('rounds ₽ to integer kopecks (1.5 ₽ → 150)', () => {
    expect(rubToKop(1.5)).toBe(150);
    expect(rubToKop(1)).toBe(100);
    expect(rubToKop(0)).toBe(0);
    expect(rubToKop(12.34)).toBe(1234);
  });
});

describe('TopupDrawer — requestId idempotency', () => {
  it('mints requestId once and reuses it across re-renders (not regenerated)', async () => {
    let n = 0;
    const uuidSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockImplementation(
        () => `id-${++n}` as `${string}-${string}-${string}-${string}-${string}`,
      );
    mockTopup.mockResolvedValue({ balanceKop: 500, alreadyApplied: false });

    const el = <TopupDrawer userId="u1" email="a@b.co" onClose={() => {}} />;
    const { rerender } = render(el);
    rerender(el);
    rerender(el);
    // Minted in the lazy useState initializer → exactly one call despite 3 renders.
    expect(uuidSpy).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('amount'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('reason'), { target: { value: 'приз' } });
    fireEvent.click(screen.getByRole('button', { name: /начислить/i }));

    await waitFor(() => expect(mockTopup).toHaveBeenCalledTimes(1));
    // 5 ₽ → 500 коп; requestId is the single minted id, not a fresh one.
    expect(mockTopup).toHaveBeenCalledWith('u1', {
      amountKop: 500,
      reason: 'приз',
      requestId: 'id-1',
    });

    uuidSpy.mockRestore();
  });
});

// BalanceSection — wallet balance + recent ledger in the ProfileDrawer.
// Fetched fresh on mount; we mock the billing client so this isolates the
// loading / loaded / failed render states. (scss module stubbed, как в
// ProfileDrawer.test.tsx.)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@/shared/lib/api/billing', () => ({
  fetchBalance: vi.fn(),
  fetchLedger: vi.fn(),
}));

vi.mock('../BalanceSection.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `bs-${String(p)}` }),
}));

import { fetchBalance, fetchLedger, type LedgerEntry } from '@/shared/lib/api/billing';
import { BalanceSection } from '../BalanceSection';

const mockBalance = vi.mocked(fetchBalance);
const mockLedger = vi.mocked(fetchLedger);

const ISO = '2026-06-08T00:00:00.000Z';
const charge: LedgerEntry = {
  id: 'l1',
  amountKop: -50,
  balanceAfterKop: 12250,
  kind: 'charge',
  feature: 'free_text_parse',
  requestId: 'r1',
  createdAt: ISO,
};
const grant: LedgerEntry = {
  id: 'l0',
  amountKop: 5000,
  balanceAfterKop: 5000,
  kind: 'grant',
  feature: null,
  requestId: null,
  createdAt: ISO,
};

beforeEach(() => {
  mockBalance.mockReset();
  mockLedger.mockReset();
});

describe('BalanceSection', () => {
  it('shows a … placeholder while the balance is loading', () => {
    mockBalance.mockReturnValue(new Promise<never>(() => {}));
    mockLedger.mockReturnValue(new Promise<never>(() => {}));
    render(<BalanceSection />);
    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('renders the balance, ledger rows and the disabled top-up button once loaded', async () => {
    mockBalance.mockResolvedValue({ balanceKop: 12300, balanceRub: 123 });
    mockLedger.mockResolvedValue([charge, grant]);
    render(<BalanceSection />);

    expect(await screen.findByText('123 ₽')).toBeInTheDocument();
    // charge is labelled by feature, grant falls back to its kind label
    expect(screen.getByText('Разбор еды')).toBeInTheDocument();
    expect(screen.getByText('Начисление')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Пополнить — скоро' })).toBeDisabled();
  });

  it('shows the failure hint (and hides the top-up button) when the balance fetch rejects', async () => {
    mockBalance.mockRejectedValue(new Error('GET /api/balance 500'));
    mockLedger.mockResolvedValue([]);
    render(<BalanceSection />);

    expect(await screen.findByText('Не удалось загрузить баланс')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Пополнить — скоро' }),
    ).not.toBeInTheDocument();
  });
});

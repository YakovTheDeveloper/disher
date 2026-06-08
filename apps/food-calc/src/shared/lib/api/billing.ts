import { authedFetch } from './authedFetch';
import { API_BASE } from './base';

// Read-only wallet client. Balance/ledger power the ProfileDrawer BalanceSection.
// Money is integer kopecks (1 ₽ = 100 коп).

export interface WalletBalance {
  balanceKop: number;
  balanceRub: number;
}

export type LedgerKind = 'grant' | 'topup' | 'charge' | 'refund';

export interface LedgerEntry {
  id: string;
  amountKop: number;
  balanceAfterKop: number;
  kind: LedgerKind;
  feature: string | null;
  requestId: string | null;
  createdAt: string;
}

export async function fetchBalance(signal?: AbortSignal): Promise<WalletBalance> {
  const res = await authedFetch(`${API_BASE}/api/balance`, { signal });
  if (!res.ok) throw new Error(`GET /api/balance ${res.status}`);
  return res.json() as Promise<WalletBalance>;
}

export async function fetchLedger(limit = 20, signal?: AbortSignal): Promise<LedgerEntry[]> {
  const res = await authedFetch(`${API_BASE}/api/balance/ledger?limit=${limit}`, { signal });
  if (!res.ok) throw new Error(`GET /api/balance/ledger ${res.status}`);
  const data = (await res.json()) as { items?: LedgerEntry[] };
  return data.items ?? [];
}

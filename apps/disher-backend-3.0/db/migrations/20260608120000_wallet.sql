-- 2026-06-08 — see apps/disher-backend-3.0/tds/billing-credits-2026-06-08.md
--
-- Prepaid ruble wallet. Points are rubles 1:1; every request that ultimately
-- calls OpenRouter debits the user's balance.
--
--   `wallet`        — fast balance cache. Money is integer KOPECKS (bigint),
--                     never float. 1 ₽ = 100 коп.
--   `wallet_ledger` — immutable journal, the source of truth. One row per money
--                     movement: grant | topup | charge | refund. Balance is the
--                     running sum; `wallet.balance_kop` mirrors it for O(1) reads
--                     and for the atomic conditional decrement.
--
-- Invariants enforced HERE (DB-level backstops):
--   * balance never negative              → CHECK (balance_kop >= 0)
--   * no double charge/refund/welcome     → UNIQUE (user_id, kind, request_id)
-- The atomic conditional decrement that actually prevents oversell + races
-- lives in the app (src/billing/wallet.ts). Pre-launch single user, no backfill.

begin;

create table public.wallet (
  user_id     uuid primary key references public.users(id) on delete cascade,
  balance_kop bigint not null default 0 check (balance_kop >= 0),
  updated_at  timestamptz not null default now()
);

create table public.wallet_ledger (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  amount_kop        bigint not null,              -- signed: <0 charge, >0 grant/topup/refund
  balance_after_kop bigint not null,
  kind              text not null check (kind in ('grant','topup','charge','refund')),
  feature           text,                         -- e.g. 'daily_analysis' for charge/refund
  request_id        text,                         -- idempotency key (client req id / provider txn id)
  meta              jsonb not null default '{}'::jsonb,  -- diagnostics: {model, or_cost_usd, reason}
  created_at        timestamptz not null default now()
);

-- Idempotency: a given (user, kind, request_id) can exist at most once. A charge
-- and its matching refund share request_id but differ by kind, so they coexist.
create unique index wallet_ledger_idem_idx
  on public.wallet_ledger (user_id, kind, request_id)
  where request_id is not null;

create index wallet_ledger_user_created_idx
  on public.wallet_ledger (user_id, created_at desc);

commit;

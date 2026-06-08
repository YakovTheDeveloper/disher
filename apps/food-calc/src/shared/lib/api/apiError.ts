// Typed API errors shared across every backend fetcher.

/**
 * 402 from a paid endpoint — the wallet can't cover the feature price. Carries a
 * ready-to-show RU message so any surface that renders `err.message` reads
 * correctly without bespoke handling, plus need/have for richer UIs.
 */
export class PaymentRequiredError extends Error {
  readonly needKop: number;
  readonly haveKop: number;
  constructor(needKop = 0, haveKop = 0) {
    super('Недостаточно средств — пополните баланс');
    this.name = 'PaymentRequiredError';
    this.needKop = needKop;
    this.haveKop = haveKop;
  }
}

export interface ApiError {
  status: number;
  paymentRequired: boolean;
  /** User-friendly RU message (localized for 402, else the backend `error`). */
  message: string;
  needKop?: number;
  haveKop?: number;
}

/**
 * Read a non-ok Response into a structured error WITHOUT throwing. Lets callers
 * that wrap errors in their own shape (e.g. DailyStreamError) keep doing so.
 */
type ApiErrorBody = { error?: unknown; needKop?: unknown; haveKop?: unknown };

export async function readApiError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    /* non-JSON body — fall through to `HTTP <status>` */
  }
  const paymentRequired = res.status === 402;
  return {
    status: res.status,
    paymentRequired,
    needKop: typeof body?.needKop === 'number' ? body.needKop : undefined,
    haveKop: typeof body?.haveKop === 'number' ? body.haveKop : undefined,
    message: paymentRequired
      ? 'Недостаточно средств — пополните баланс'
      : typeof body?.error === 'string'
        ? body.error
        : `HTTP ${res.status}`,
  };
}

/** Throw the right typed error for a non-ok Response (JSON fetchers). */
export async function throwApiError(res: Response): Promise<never> {
  const e = await readApiError(res);
  if (e.paymentRequired) throw new PaymentRequiredError(e.needKop, e.haveKop);
  throw new Error(e.message);
}

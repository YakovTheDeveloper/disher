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

/**
 * Any non-402 non-ok backend response, thrown as a TYPED error instead of a bare
 * `Error`. Mirrors the backend's RFC 9457-subset problem+json body (api/errors.ts):
 * a stable `status` + `code` the UI can branch on, the `instance` request id for
 * support/log correlation, plus `fieldErrors`/`retryAfter` extensions. The
 * numeric `status` makes it response-like, so classifyError routes it through
 * classifyByStatus with these extras already populated.
 */
export class ApiResponseError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly instance?: string;
  readonly fieldErrors?: Record<string, string>;
  readonly retryAfter?: number;
  constructor(
    message: string,
    init: {
      status: number;
      code?: string;
      instance?: string;
      fieldErrors?: Record<string, string>;
      retryAfter?: number;
    },
  ) {
    super(message);
    this.name = 'ApiResponseError';
    this.status = init.status;
    this.code = init.code;
    this.instance = init.instance;
    this.fieldErrors = init.fieldErrors;
    this.retryAfter = init.retryAfter;
  }
}

export interface ApiError {
  status: number;
  paymentRequired: boolean;
  /** User-friendly RU message (localized for 402, else the backend detail/title/error). */
  message: string;
  /** Stable machine code from the problem+json body (branch on this, not prose). */
  code?: string;
  /** Per-request id — echoed from the body (or the X-Request-Id header). */
  instance?: string;
  needKop?: number;
  haveKop?: number;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
}

/**
 * Read a non-ok Response into a structured error WITHOUT throwing. Lets callers
 * that wrap errors in their own shape (e.g. DailyStreamError) keep doing so.
 * Understands both the new problem+json subset ({ code, title, detail, instance,
 * fieldErrors, retryAfter }) AND the legacy `{ error }` shape.
 */
type ApiErrorBody = {
  error?: unknown;
  code?: unknown;
  title?: unknown;
  detail?: unknown;
  instance?: unknown;
  needKop?: unknown;
  haveKop?: unknown;
  fieldErrors?: unknown;
  retryAfter?: unknown;
};

function asStringRecord(v: unknown): Record<string, string> | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string') out[k] = val;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function readApiError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    /* non-JSON body — fall through to `HTTP <status>` */
  }
  const paymentRequired = res.status === 402;
  const instance =
    typeof body?.instance === 'string' ? body.instance : res.headers.get('x-request-id') ?? undefined;
  // message: prefer the specific `detail`, then the summary `title`, then the
  // legacy `error` string, then a status fallback.
  const message = paymentRequired
    ? 'Недостаточно средств — пополните баланс'
    : typeof body?.detail === 'string'
      ? body.detail
      : typeof body?.error === 'string'
        ? body.error
        : typeof body?.title === 'string'
          ? body.title
          : `HTTP ${res.status}`;
  return {
    status: res.status,
    paymentRequired,
    message,
    code: typeof body?.code === 'string' ? body.code : undefined,
    instance,
    needKop: typeof body?.needKop === 'number' ? body.needKop : undefined,
    haveKop: typeof body?.haveKop === 'number' ? body.haveKop : undefined,
    fieldErrors: asStringRecord(body?.fieldErrors),
    retryAfter: typeof body?.retryAfter === 'number' ? body.retryAfter : undefined,
  };
}

/** Throw the right typed error for a non-ok Response (JSON fetchers). */
export async function throwApiError(res: Response): Promise<never> {
  const e = await readApiError(res);
  if (e.paymentRequired) throw new PaymentRequiredError(e.needKop, e.haveKop);
  throw new ApiResponseError(e.message, {
    status: e.status,
    code: e.code,
    instance: e.instance,
    fieldErrors: e.fieldErrors,
    retryAfter: e.retryAfter,
  });
}

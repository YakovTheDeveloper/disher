import type { ToastAction } from '@/shared/lib/toaster/toaster';

// Maps an analysis failure to a user-facing toast (message + optional action).
// Analysis is a paid AI operation, so the failure text is deliberately specific
// per cause (what happened + what to do) — a generic «что-то пошло не так»
// leaves the user unsure whether they were charged or should retry.

export type AnalysisFailureKind =
  | 'payment' // 402 — wallet can't cover the price
  | 'rate_limit' // 429 — too many requests
  | 'server' // 5xx / parse error
  | 'timeout' // server didn't answer in time
  | 'network'; // no connection

export interface AnalysisFailureToast {
  message: string;
  action?: ToastAction;
}

export function analysisFailureToast(
  kind: AnalysisFailureKind,
  opts: { onRetry?: () => void } = {},
): AnalysisFailureToast {
  const retry: ToastAction | undefined = opts.onRetry
    ? { label: 'Повторить', onClick: opts.onRetry }
    : undefined;

  switch (kind) {
    case 'payment':
      // Top-up is not self-serve yet (BalanceSection shows «Пополнить — скоро»),
      // so there's no destination to navigate to — just the clear reason.
      return { message: 'Недостаточно средств — пополните баланс' };
    case 'rate_limit':
      return { message: 'Слишком много запросов, подождите', action: retry };
    case 'server':
      return { message: 'Сервер не смог построить анализ', action: retry };
    case 'timeout':
      return { message: 'Сервер не отвечает', action: retry };
    case 'network':
      return { message: 'Нет связи — анализ не запущен' };
  }
}

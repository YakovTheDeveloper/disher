import { API_BASE } from '@/shared/lib/api/base';

export type CorrectionType =
  | 'accepted-top1'
  | 'switched-ambiguous'
  | 'manual-search'
  | 'deleted';

export interface TelemetryCorrection {
  originalName: string;
  matcherChoice: string;
  userChoice: string | null;
  correctionType: CorrectionType;
}

export interface TelemetryEventPayload {
  requestId: string;
  userId: string;
  action: 'commit' | 'abandon';
  itemsTotal: number;
  itemsCommitted: number;
  itemsDeleted: number;
  itemsWithEditedFood: number;
  itemsWithEditedTime: number;
  itemsWithEditedQty: number;
  corrections: TelemetryCorrection[];
  llmLatencyMs: number;
  matcherLatencyMs: number;
  reviewDurationMs: number;
}

export function sendMatcherTelemetry(payload: TelemetryEventPayload): void {
  const url = `${API_BASE}/api/matcher-telemetry`;
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }
  } catch {
    // fall through
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // fire-and-forget; don't surface errors
  });
}

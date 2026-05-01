import type { AnalyticsTab } from "./types";

// localStorage fallback for offline reads. Cache lives on backend (SQLite,
// keyed by userId+date+tab+inputHash); this is only the offline mirror so a
// user without network can still see the last successful analysis.

const KEY_PREFIX = "analytics_cache_";

function buildKey(userId: string, date: string, tab: AnalyticsTab): string {
  return `${KEY_PREFIX}${userId}_${date}_${tab}`;
}

export function getCachedAnalysis(
  userId: string,
  date: string,
  tab: AnalyticsTab,
): string | null {
  try {
    return localStorage.getItem(buildKey(userId, date, tab));
  } catch {
    return null;
  }
}

export function setCachedAnalysis(
  userId: string,
  date: string,
  tab: AnalyticsTab,
  text: string,
): void {
  try {
    localStorage.setItem(buildKey(userId, date, tab), text);
  } catch {
    // quota or unavailable — analytics are recompute-able, drop silently
  }
}

// Wipe-on-identity-switch. Called from auth-store on signIn/signOut so a
// previous user's cached markdown can't leak into the next session on the
// same device.
export function clearAnalyticsCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // localStorage unavailable — nothing to wipe
  }
}

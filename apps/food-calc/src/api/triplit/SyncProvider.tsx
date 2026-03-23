import { createContext, useContext, useSyncExternalStore } from "react";
import { getSyncStatus, onSyncStatusChange, type SyncStatus } from "./session";

const SyncContext = createContext<SyncStatus>("idle");

function subscribe(callback: () => void) {
  return onSyncStatusChange(callback);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const status = useSyncExternalStore(subscribe, getSyncStatus, getSyncStatus);
  return <SyncContext.Provider value={status}>{children}</SyncContext.Provider>;
}

export function useSyncStatus(): SyncStatus {
  return useContext(SyncContext);
}

import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
// fake-indexeddb/auto must be imported before session (which imports client.ts
// that accesses indexedDB at module load time)
import 'fake-indexeddb/auto';
import { idbCount, _resetIdbCache } from './session';

// ─── Triplit IDB key format (@triplit/client ^1.0.50) ────────────────────────
// EntityStore → EntityDataStore(storagePrefix=["data"])
//   key: storage.scope(["data"]).set([collection, id], value)
//   → full IDB key: ["data", collection, id]
//
// Source: @triplit/db/dist/entity-store.js  line 13
//   this.dataStore = new EntityDataStore([...this.storagePrefix, 'data'])
// Source: @triplit/db/dist/entity-data-store.js  line 10
//   prefixedStorage.get([collection, id])
//
// If these tests break after a Triplit upgrade, the key tuple structure changed.
// Also check: idbCount() in session.ts and the version comment there.

const DB_NAME = 'triplit';
const STORE_NAME = 'triplit';

function openTestDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putRecord(db: IDBDatabase, collection: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ id }, ['data', collection, id]);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

describe('idbCount — Triplit IDB key format', () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    // fresh IDBFactory + reset cached connection per test
    globalThis.indexedDB = new IDBFactory();
    _resetIdbCache();
    db = await openTestDb();
  });

  it('counts records for a collection', async () => {
    await putRecord(db, 'foods', 'id-1');
    await putRecord(db, 'foods', 'id-2');
    await putRecord(db, 'foods', 'id-3');
    db.close();

    expect(await idbCount('foods')).toBe(3);
  });

  it('returns 0 for an empty collection', async () => {
    db.close();
    expect(await idbCount('foods')).toBe(0);
  });

  it('key prefix does not bleed between collections', async () => {
    // "foods" prefix must not match "foodNutrients" or "foodPortions"
    await putRecord(db, 'foods', 'f1');
    await putRecord(db, 'foodNutrients', 'fn1');
    await putRecord(db, 'foodPortions', 'fp1');
    db.close();

    expect(await idbCount('foods')).toBe(1);
    expect(await idbCount('foodNutrients')).toBe(1);
    expect(await idbCount('foodPortions')).toBe(1);
  });

  it('counts only within the "data" scope — ignores other scopes', async () => {
    // Triplit also writes to other scopes (e.g. metadata, outbox)
    // Records outside ["data", ...] must not be counted
    await putRecord(db, 'foods', 'real');
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id: 'ghost' }, ['metadata', 'foods', 'ghost']);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();

    expect(await idbCount('foods')).toBe(1);
  });
});

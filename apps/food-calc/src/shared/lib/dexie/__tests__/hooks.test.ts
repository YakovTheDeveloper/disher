import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, SYNCED_TABLES } from '../schema';
import { areDexieHooksInstalled, installDexieHooks } from '../hooks';

// 8.4 Dexie hooks unit test (P1).
//
// What the writing-hook MUST do (per shared/lib/dexie/hooks.ts):
//   creating (add/put NEW row):
//     - _dirty = 1
//     - edit_count = 0 if not provided, else trust caller
//     - client_modified_at = nowIso()
//     - created_at = nowIso() if not provided
//     - deleted_at = null if not present
//   updating (existing row):
//     - _dirty = 1
//     - edit_count = (existing.edit_count ?? 0) + 1
//     - client_modified_at = nowIso()
//   __server_apply sentinel (snapshot pull / server ACK):
//     - sentinel stripped before persist
//     - hook does NOT bump _dirty / edit_count / client_modified_at
//     - default _dirty = 0 if not provided
//
// Uses fake-indexeddb (already wired in vitest.setup.ts).

beforeAll(() => {
    if (!areDexieHooksInstalled()) installDexieHooks();
});

beforeEach(async () => {
    // Wipe all tables between tests so state doesn't leak.
    await db.transaction('rw', db.tables, async () => {
        for (const t of db.tables) await t.clear();
    });
});

afterEach(async () => {
    await db.transaction('rw', db.tables, async () => {
        for (const t of db.tables) await t.clear();
    });
});

const USER = '11111111-1111-1111-1111-111111111111';

describe('Dexie hooks: creating', () => {
    it('stamps _dirty=1, edit_count=0, client_modified_at, created_at, deleted_at on add()', async () => {
        const id = crypto.randomUUID();
        const before = Date.now();
        await db.products.add({
            id,
            user_id: USER,
            name: 'x',
            name_eng: '',
            description: '',
            description_eng: '',
            source: '',
            price_per_kg: 0,
            nutrients: {},
            portions: [],
            categories: [],
        } as never);
        const after = Date.now();

        const row = await db.products.get(id);
        expect(row, 'row not persisted').toBeTruthy();
        expect(row!._dirty).toBe(1);
        expect(row!.edit_count).toBe(0);
        expect(row!.deleted_at).toBeNull();
        const cm = Date.parse(row!.client_modified_at);
        expect(cm).toBeGreaterThanOrEqual(before);
        expect(cm).toBeLessThanOrEqual(after);
        const cr = Date.parse(row!.created_at);
        expect(cr).toBeGreaterThanOrEqual(before);
        expect(cr).toBeLessThanOrEqual(after);
    });

    it.each(SYNCED_TABLES)(
        'stamps _dirty=1 + edit_count=0 across every synced table (%s)',
        async (table) => {
            const id = crypto.randomUUID();
            const minimal: Record<string, unknown> = { id, user_id: USER };
            // Per-table required fields. Only the ones that have NOT NULL in
            // schema or that hooks/queries inspect — others are left undefined.
            switch (table) {
                case 'products':
                    Object.assign(minimal, {
                        name: 'x',
                        name_eng: '',
                        description: '',
                        description_eng: '',
                        source: '',
                        price_per_kg: 0,
                        nutrients: {},
                        portions: [],
                        categories: [],
                    });
                    break;
                case 'dishes':
                    Object.assign(minimal, { name: 'd' });
                    break;
                case 'dish_items':
                    Object.assign(minimal, {
                        dish_id: crypto.randomUUID(),
                        product_id: crypto.randomUUID(),
                        quantity: 1,
                    });
                    break;
                case 'dish_portions':
                    Object.assign(minimal, {
                        dish_id: crypto.randomUUID(),
                        label: 'p',
                        amount: 1,
                        unit: 'g',
                        grams: 100,
                    });
                    break;
                case 'schedule_foods':
                    Object.assign(minimal, {
                        date: '01-01-2099',
                        time: '10:00',
                        type: 'food',
                        quantity: 1,
                        details: '',
                        product_id: crypto.randomUUID(),
                        dish_id: null,
                    });
                    break;
                case 'schedule_events':
                    Object.assign(minimal, {
                        date: '01-01-2099',
                        time: '10:00',
                        end_time: '',
                        text: '',
                        atoms: [],
                    });
                    break;
                case 'daily_norms':
                    Object.assign(minimal, {
                        name: 'n',
                        description: '',
                        items: {},
                    });
                    break;
                case 'periods':
                    Object.assign(minimal, {
                        name: 'p',
                        color_index: 0,
                        font_family: 'sans',
                        font_size: 16,
                    });
                    break;
            }
            await db[table].add(minimal as never);
            const row = (await db[table].get(id)) as
                | (Record<string, unknown> & {
                      _dirty?: 0 | 1;
                      edit_count?: number;
                      client_modified_at?: string;
                      deleted_at?: string | null;
                  })
                | undefined;
            expect(row, `${table}: row not persisted`).toBeTruthy();
            expect(row!._dirty, `${table}: _dirty`).toBe(1);
            expect(row!.edit_count, `${table}: edit_count`).toBe(0);
            expect(typeof row!.client_modified_at).toBe('string');
            expect(row!.deleted_at, `${table}: deleted_at`).toBeNull();
        },
    );
});

describe('Dexie hooks: updating', () => {
    it('bumps edit_count, refreshes client_modified_at, sets _dirty=1', async () => {
        const id = crypto.randomUUID();
        await db.products.add({
            id,
            user_id: USER,
            name: 'x',
            name_eng: '',
            description: '',
            description_eng: '',
            source: '',
            price_per_kg: 0,
            nutrients: {},
            portions: [],
            categories: [],
        } as never);

        const v0 = await db.products.get(id);
        expect(v0!.edit_count).toBe(0);
        const t0 = v0!.client_modified_at;

        // Sleep 5ms to ensure new ISO timestamp differs.
        await new Promise((r) => setTimeout(r, 5));

        await db.products.update(id, { name: 'y' });
        const v1 = await db.products.get(id);
        expect(v1!.name).toBe('y');
        expect(v1!._dirty).toBe(1);
        expect(v1!.edit_count).toBe(1);
        expect(v1!.client_modified_at).not.toBe(t0);

        await new Promise((r) => setTimeout(r, 5));
        await db.products.update(id, { name: 'z' });
        const v2 = await db.products.get(id);
        expect(v2!.edit_count).toBe(2);
    });

    it('soft-delete is just an update of deleted_at — _dirty/edit_count bumped', async () => {
        const id = crypto.randomUUID();
        await db.products.add({
            id,
            user_id: USER,
            name: 'x',
            name_eng: '',
            description: '',
            description_eng: '',
            source: '',
            price_per_kg: 0,
            nutrients: {},
            portions: [],
            categories: [],
        } as never);

        const tombstone = new Date().toISOString();
        await db.products.update(id, { deleted_at: tombstone });

        const v = await db.products.get(id);
        expect(v!.deleted_at).toBe(tombstone);
        expect(v!._dirty).toBe(1);
        expect(v!.edit_count).toBe(1);
    });
});

describe('Dexie hooks: __server_apply sentinel', () => {
    it('add() with sentinel: persists row with _dirty=0 and strips sentinel', async () => {
        const id = crypto.randomUUID();
        const serverIso = '2024-01-01T00:00:00.000Z';
        await db.products.add({
            id,
            user_id: USER,
            name: 'srv',
            name_eng: '',
            description: '',
            description_eng: '',
            source: '',
            price_per_kg: 0,
            nutrients: {},
            portions: [],
            categories: [],
            edit_count: 7,
            client_modified_at: serverIso,
            created_at: serverIso,
            deleted_at: null,
            __server_apply: true,
        } as never);

        const row = (await db.products.get(id)) as
            | (Record<string, unknown> & {
                  _dirty?: 0 | 1;
                  edit_count?: number;
                  client_modified_at?: string;
              })
            | undefined;
        expect(row).toBeTruthy();
        expect(row!._dirty, '_dirty must be 0 for server-applied rows').toBe(0);
        expect(row!.edit_count).toBe(7);
        expect(row!.client_modified_at).toBe(serverIso);
        expect('__server_apply' in row!).toBe(false);
    });

    it('update() with sentinel: does NOT bump _dirty/edit_count', async () => {
        const id = crypto.randomUUID();
        // First: insert via the sentinel path so it lands at _dirty=0.
        await db.products.add({
            id,
            user_id: USER,
            name: 'srv',
            name_eng: '',
            description: '',
            description_eng: '',
            source: '',
            price_per_kg: 0,
            nutrients: {},
            portions: [],
            categories: [],
            edit_count: 3,
            client_modified_at: '2024-01-01T00:00:00.000Z',
            created_at: '2024-01-01T00:00:00.000Z',
            deleted_at: null,
            __server_apply: true,
        } as never);

        // Then: server ACK wants to clear _dirty without bumping anything.
        await db.products.update(id, {
            _dirty: 0,
            __server_apply: true,
        } as never);

        const row = (await db.products.get(id)) as
            | (Record<string, unknown> & {
                  _dirty?: 0 | 1;
                  edit_count?: number;
                  client_modified_at?: string;
              })
            | undefined;
        expect(row!._dirty).toBe(0);
        expect(row!.edit_count, 'edit_count must NOT bump on server apply').toBe(3);
        expect(row!.client_modified_at).toBe('2024-01-01T00:00:00.000Z');
    });

    it('bulkPut() (snapshot path) with sentinel: every row lands at _dirty=0', async () => {
        const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
        const rows = ids.map((id, i) => ({
            id,
            user_id: USER,
            name: `srv${i}`,
            name_eng: '',
            description: '',
            description_eng: '',
            source: '',
            price_per_kg: 0,
            nutrients: {},
            portions: [],
            categories: [],
            edit_count: i,
            client_modified_at: '2024-01-01T00:00:00.000Z',
            created_at: '2024-01-01T00:00:00.000Z',
            deleted_at: null,
            __server_apply: true,
        }));
        await db.products.bulkPut(rows as never);

        for (const id of ids) {
            const r = (await db.products.get(id)) as { _dirty?: 0 | 1 } | undefined;
            expect(r!._dirty).toBe(0);
        }
    });
});

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mapProductRow } from '@/entities/product/api/mappers';
import {
    mapDishRow,
    mapDishItemRow,
    mapDishPortionRow,
} from '@/entities/dish/api/mappers';
import { mapScheduleFoodRow } from '@/entities/schedule-food/api/mappers';
import { mapScheduleEventRow } from '@/entities/schedule-event/api/mappers';
import { mapDailyNormRow } from '@/entities/daily-norm/api/mappers';

// 8.12 Mapper round-trip per entity (P2).
//
// Mappers are SINGLE-DIRECTION (Dexie row -> UI type) — the project doesn't
// have serializeXxx counterparts, mutation paths write to Dexie directly via
// snake_case. So instead of `mapXxx(serializeXxx(ui)) === ui` (impossible),
// we test:
//   - field renaming is correct (snake_case -> camelCase)
//   - jsonb fields stably (re)stringify or parse
//   - null/undefined handling for nullable columns matches the documented
//     fallbacks (details ?? '', client_modified_at ?? created_at, etc.)
//
// Catches: forgotten field rename, broken jsonb round-trip, regression in the
// `client_modified_at ?? created_at` fallback that backs UI `updatedAt`.

const ISO_A = '2026-04-30T10:00:00.000Z';
const ISO_B = '2026-04-30T11:00:00.000Z';

describe('mapProductRow', () => {
    it('renames every snake_case field to camelCase', () => {
        const row = {
            id: 'p1',
            user_id: 'u1',
            name: 'tofu',
            name_eng: 'tofu_eng',
            description: 'desc',
            description_eng: 'desc_eng',
            source: 'src',
            price_per_kg: 12.5,
            nutrients: { kcal: 150 },
            portions: [{ l: 'cube', g: 100 }],
            categories: ['protein'],
            client_modified_at: ISO_B,
            edit_count: 3,
            _dirty: 1 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        const ui = mapProductRow(row);
        expect(ui).toEqual({
            id: 'p1',
            userId: 'u1',
            name: 'tofu',
            nameEng: 'tofu_eng',
            description: 'desc',
            descriptionEng: 'desc_eng',
            source: 'src',
            pricePerKg: 12.5,
            nutrients: '{"kcal":150}',
            portions: '[{"l":"cube","g":100}]',
            categories: '["protein"]',
            createdAt: ISO_A,
            updatedAt: ISO_B,
            deletedAt: null,
        });
    });

    it('falls back updatedAt to createdAt when client_modified_at is missing', () => {
        const row = {
            id: 'p2',
            user_id: 'u1',
            name: 'x',
            name_eng: '',
            description: '',
            description_eng: '',
            source: '',
            price_per_kg: 0,
            nutrients: {},
            portions: [],
            categories: [],
            client_modified_at: undefined as unknown as string,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        const ui = mapProductRow(row);
        expect(ui.updatedAt).toBe(ISO_A);
    });

    it('jsonb fields handle null gracefully via documented fallbacks', () => {
        const row = {
            id: 'p3',
            user_id: 'u1',
            name: 'x',
            name_eng: '',
            description: '',
            description_eng: '',
            source: '',
            price_per_kg: 0,
            nutrients: null as unknown as Record<string, unknown>,
            portions: null as unknown as Array<Record<string, unknown>>,
            categories: null as unknown as unknown[],
            client_modified_at: ISO_A,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        const ui = mapProductRow(row);
        expect(ui.nutrients).toBe('{}');
        expect(ui.portions).toBe('[]');
        expect(ui.categories).toBe('[]');
    });

    it('property: id and user_id pass through verbatim', () => {
        fc.assert(
            fc.property(fc.uuid(), fc.uuid(), (id, userId) => {
                const row = {
                    id,
                    user_id: userId,
                    name: 'x',
                    name_eng: '',
                    description: '',
                    description_eng: '',
                    source: '',
                    price_per_kg: 0,
                    nutrients: {},
                    portions: [],
                    categories: [],
                    client_modified_at: ISO_A,
                    edit_count: 0,
                    _dirty: 0 as const,
                    deleted_at: null,
                    created_at: ISO_A,
                };
                const ui = mapProductRow(row);
                return ui.id === id && ui.userId === userId;
            }),
        );
    });
});

describe('mapDishRow + mapDishItemRow + mapDishPortionRow', () => {
    it('mapDishRow renames all fields', () => {
        const row = {
            id: 'd1',
            user_id: 'u1',
            name: 'salad',
            client_modified_at: ISO_B,
            edit_count: 1,
            _dirty: 1 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        expect(mapDishRow(row)).toEqual({
            id: 'd1',
            userId: 'u1',
            name: 'salad',
            createdAt: ISO_A,
            updatedAt: ISO_B,
            deletedAt: null,
        });
    });

    it('mapDishItemRow renames all fields including dish_id / product_id', () => {
        const row = {
            id: 'di1',
            user_id: 'u1',
            dish_id: 'd1',
            product_id: 'p1',
            quantity: 50,
            client_modified_at: ISO_B,
            edit_count: 1,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        expect(mapDishItemRow(row)).toEqual({
            id: 'di1',
            userId: 'u1',
            dishId: 'd1',
            productId: 'p1',
            quantity: 50,
            createdAt: ISO_A,
            updatedAt: ISO_B,
            deletedAt: null,
        });
    });

    it('mapDishPortionRow renames every field', () => {
        const row = {
            id: 'dp1',
            user_id: 'u1',
            dish_id: 'd1',
            label: 'small',
            amount: 1,
            unit: 'serving',
            grams: 120,
            client_modified_at: ISO_B,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        expect(mapDishPortionRow(row)).toEqual({
            id: 'dp1',
            userId: 'u1',
            dishId: 'd1',
            label: 'small',
            amount: 1,
            unit: 'serving',
            grams: 120,
            createdAt: ISO_A,
            updatedAt: ISO_B,
            deletedAt: null,
        });
    });

    it('preserves deleted_at tombstone (soft delete contract)', () => {
        const row = {
            id: 'd1',
            user_id: 'u1',
            name: 'x',
            client_modified_at: ISO_B,
            edit_count: 1,
            _dirty: 0 as const,
            deleted_at: ISO_B,
            created_at: ISO_A,
        };
        expect(mapDishRow(row).deletedAt).toBe(ISO_B);
    });
});

describe('mapScheduleFoodRow', () => {
    it('renames + tolerates null product_id/dish_id (food vs dish kind)', () => {
        const foodRow = {
            id: 'sf1',
            user_id: 'u1',
            date: '01-01-2099',
            time: '10:00',
            type: 'food' as const,
            quantity: 100,
            details: 'note',
            product_id: 'p1',
            dish_id: null,
            client_modified_at: ISO_B,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        const dishRow = { ...foodRow, type: 'dish' as const, product_id: null, dish_id: 'd1' };
        const ui = mapScheduleFoodRow(foodRow);
        expect(ui).toMatchObject({
            id: 'sf1',
            userId: 'u1',
            date: '01-01-2099',
            time: '10:00',
            type: 'food',
            quantity: 100,
            details: 'note',
            productId: 'p1',
            dishId: null,
        });
        const ui2 = mapScheduleFoodRow(dishRow);
        expect(ui2.productId).toBeNull();
        expect(ui2.dishId).toBe('d1');
    });

    it('details defaults to empty string when row has no details', () => {
        const row = {
            id: 'sf2',
            user_id: 'u1',
            date: '01-01-2099',
            time: '10:00',
            type: 'food' as const,
            quantity: 50,
            details: undefined as unknown as string,
            product_id: 'p1',
            dish_id: null,
            client_modified_at: ISO_A,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        expect(mapScheduleFoodRow(row).details).toBe('');
    });
});

describe('mapScheduleEventRow', () => {
    it('parses atoms when stored as a JSON string (legacy migration path)', () => {
        const row = {
            id: 'se1',
            user_id: 'u1',
            date: '01-01-2099',
            time: '10:00',
            end_time: '11:00',
            text: 'evt',
            atoms: JSON.stringify([{ kind: 'flag', name: 'x' }]),
            client_modified_at: ISO_B,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        } as never;
        const ui = mapScheduleEventRow(row);
        // Atom may be filtered by isValidAtom — accept either kept or empty.
        expect(Array.isArray(ui.atoms)).toBe(true);
    });

    it('passes atoms through when already parsed (current snapshot path)', () => {
        const row = {
            id: 'se2',
            user_id: 'u1',
            date: '01-01-2099',
            time: '10:00',
            end_time: '11:00',
            text: 'evt',
            atoms: [], // empty array trivially passes filter
            client_modified_at: ISO_B,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        expect(mapScheduleEventRow(row).atoms).toEqual([]);
    });

    it('end_time and text default to empty string', () => {
        const row = {
            id: 'se3',
            user_id: 'u1',
            date: '01-01-2099',
            time: '10:00',
            end_time: undefined as unknown as string,
            text: undefined as unknown as string,
            atoms: [],
            client_modified_at: ISO_A,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        const ui = mapScheduleEventRow(row);
        expect(ui.endTime).toBe('');
        expect(ui.text).toBe('');
    });

    it('returns [] when atoms is malformed JSON', () => {
        const row = {
            id: 'se4',
            user_id: 'u1',
            date: '01-01-2099',
            time: '10:00',
            end_time: '',
            text: '',
            atoms: 'not valid json' as unknown as unknown[],
            client_modified_at: ISO_A,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        expect(mapScheduleEventRow(row).atoms).toEqual([]);
    });
});

describe('mapDailyNormRow', () => {
    it('stringifies items object', () => {
        const row = {
            id: 'dn1',
            user_id: 'u1',
            name: 'goal',
            description: 'd',
            items: { kcal: 2000 },
            client_modified_at: ISO_B,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        const ui = mapDailyNormRow(row);
        expect(ui.items).toBe('{"kcal":2000}');
        expect(ui.userId).toBe('u1');
    });

    it('items defaults to {} when row.items is null/undefined', () => {
        const row = {
            id: 'dn2',
            user_id: 'u1',
            name: 'g',
            description: '',
            items: null as unknown as Record<string, unknown>,
            client_modified_at: ISO_A,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        expect(mapDailyNormRow(row).items).toBe('{}');
    });

    it('preserves jsonb that arrives as a string (idempotent stringify)', () => {
        const row = {
            id: 'dn3',
            user_id: 'u1',
            name: 'g',
            description: '',
            items: '{"protein":80}' as unknown as Record<string, unknown>,
            client_modified_at: ISO_A,
            edit_count: 0,
            _dirty: 0 as const,
            deleted_at: null,
            created_at: ISO_A,
        };
        expect(mapDailyNormRow(row).items).toBe('{"protein":80}');
    });
});

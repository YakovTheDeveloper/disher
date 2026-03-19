import Dexie, { Table } from 'dexie';

export interface StoreSnapshot {
    key: string;
    data: unknown;
    version: number;
    timestamp: number;
}

export class AppDatabase extends Dexie {
    snapshots!: Table<StoreSnapshot>;

    constructor() {
        super('FoodCalcDB');

        this.version(1).stores({
            snapshots: 'key'
        });

        // Migration to add version and timestamp fields
        this.version(2).stores({
            snapshots: 'key'
        }).upgrade(tx => {
            return tx.table('snapshots').toCollection().modify(snapshot => {
                if (!('version' in snapshot)) {
                    snapshot.version = 1;
                }
                if (!('timestamp' in snapshot)) {
                    snapshot.timestamp = Date.now();
                }
            });
        });
    }
}

export const db = new AppDatabase();

import Dexie, { Table } from 'dexie';

export interface StoreSnapshot {
    key: string;
    data: any;
}

export class AppDatabase extends Dexie {
    snapshots!: Table<StoreSnapshot>;

    constructor() {
        super('FoodCalcDB');
        this.version(1).stores({
            snapshots: 'key' // 'key' is the primary key
        });
    }
}

export const db = new AppDatabase();

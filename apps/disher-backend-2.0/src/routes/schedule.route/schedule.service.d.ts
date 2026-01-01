import type { Prisma } from "@prisma/client";
export declare function mapScheduleItemData(item: {
    quantity?: number;
    content: {
        variant: "custom" | "food" | "dish";
        customName?: string | null;
        foodId?: string | null;
        dishId?: string | null;
    };
}): {
    quantity: number;
    type: "food";
    foodId: number;
    dishId: any;
    customFoodName: any;
} | {
    quantity: number;
    type: "dish";
    dishId: string;
    foodId: any;
    customFoodName: any;
} | {
    quantity: number;
    type: "custom";
    customFoodName: string;
    foodId: any;
    dishId: any;
};
export declare function syncSchedule(tx: Prisma.TransactionClient, schedule: any): Promise<any>;
//# sourceMappingURL=schedule.service.d.ts.map
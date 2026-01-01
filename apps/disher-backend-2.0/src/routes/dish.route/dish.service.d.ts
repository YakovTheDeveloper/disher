import { DishZodType } from "./dish.validation";
type DishItems = DishZodType["items"];
export declare function getCreateItems(items?: DishItems): {
    create: {
        id: string;
        quantity: number;
        food: {
            connect: {
                id: number;
            };
        };
    }[];
};
export declare function getUpdateItems(items?: DishItems): {
    create: {
        id: string;
        quantity: number;
        food: {
            connect: {
                id: number;
            };
        };
    }[];
    update: {
        where: {
            id: string;
        };
        data: {
            foodId: number;
            quantity: number;
        };
    }[];
    delete: {
        id: string;
    }[];
};
export {};
//# sourceMappingURL=dish.service.d.ts.map
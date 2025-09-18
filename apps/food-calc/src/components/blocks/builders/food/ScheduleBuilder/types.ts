export type ItemActions = {
    onFoodsOpenUpdate: (id: string | number) => void;
    onFoodsOpenInfo: (id: string | number) => void;
    onTimeOpen: (id: string | number) => void;
    onQuantityOpen: (id: string | number) => void;
    onDelete: (childId: string | number) => void;
    onRecover: (childId: string | number) => void;
}
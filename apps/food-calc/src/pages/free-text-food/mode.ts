export interface CommittedItem {
  productId: string;
  quantity: number;
  time: string;
  details: string;
}

export type FreeTextFoodMode =
  | { kind: 'schedule'; date: string }
  | { kind: 'dish'; dishId: string }
  | { kind: 'standalone'; onCommit: (items: CommittedItem[]) => void };

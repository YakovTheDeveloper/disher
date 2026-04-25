/** Record<nutrientId, quantity> */
export type DailyNormItems = Record<string, number>;

export interface DailyNorm {
  id: string;
  userId: string | null;
  name: string;
  description: string;
  items: string; // serialized JSON: Record<nutrientId, quantity>
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

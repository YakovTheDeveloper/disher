/** Record<nutrientId, quantity> */
export type DailyNormItems = Record<string, number>;

export interface DailyNorm {
  id: string;
  name: string;
  description: string;
  items: string; // serialized JSON: Record<nutrientId, quantity>
  createdAt: string;
}

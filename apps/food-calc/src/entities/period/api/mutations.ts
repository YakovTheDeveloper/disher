import { triplit } from '@/api/triplit/client';
import { getCurrentUserId } from '@/api/triplit/session';
import { v4 as uuid } from 'uuid';

export async function addPeriod(params: {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  colorIndex: number;
}) {
  const id = uuid();
  await triplit.insert('periods', {
    id,
    userId: getCurrentUserId(),
    name: params.name,
    description: params.description ?? null,
    startDate: params.startDate,
    endDate: params.endDate,
    colorIndex: params.colorIndex,
  });
  return id;
}

export async function removePeriod(id: string) {
  await triplit.delete('periods', id);
}

export async function updatePeriod(
  id: string,
  updates: Partial<{
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    colorIndex: number;
  }>
) {
  await triplit.update('periods', id, (period) => {
    if (updates.name !== undefined) period.name = updates.name;
    if (updates.description !== undefined) period.description = updates.description;
    if (updates.startDate !== undefined) period.startDate = updates.startDate;
    if (updates.endDate !== undefined) period.endDate = updates.endDate;
    if (updates.colorIndex !== undefined) period.colorIndex = updates.colorIndex;
  });
}

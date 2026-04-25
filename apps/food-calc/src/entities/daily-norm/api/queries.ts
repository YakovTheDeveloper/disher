import { useQuery } from "@powersync/react";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import type { DailyNorm } from "../model/types";

function mapRow(row: Record<string, unknown>): DailyNorm {
  return snakeToCamel(row) as unknown as DailyNorm;
}

const SELECT_NORM = `
  select id, user_id, name, description, items,
         created_at, updated_at, deleted_at
  from daily_norms
  where deleted_at is null
`;

export function useDailyNorms(): DailyNorm[] {
  const { data } = useQuery<Record<string, unknown>>(SELECT_NORM);
  return data.map(mapRow);
}

export function useDailyNorm(normId: string | undefined): DailyNorm | null {
  const { data } = useQuery<Record<string, unknown>>(
    `${SELECT_NORM} and id = ?`,
    [normId ?? ""],
  );
  return data[0] ? mapRow(data[0]) : null;
}

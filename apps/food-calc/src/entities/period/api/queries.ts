import { useQuery } from "@powersync/react";
import { snakeToCamel } from "@/shared/lib/rowMapper";

export interface Period {
  id: string;
  userId: string;
  name: string;
  colorIndex: number;
  fontFamily: string;
  fontSize: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

function mapRow(row: Record<string, unknown>): Period {
  return snakeToCamel(row) as unknown as Period;
}

export function usePeriods(): Period[] {
  const { data } = useQuery<Record<string, unknown>>(
    `select id, user_id, name, color_index, font_family, font_size,
            created_at, updated_at, deleted_at
     from periods
     where deleted_at is null`,
  );
  return data.map(mapRow);
}

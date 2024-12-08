import {
  fetchCreateNorm,
  fetchGetAllNorm,
  fetchUpdateNorm,
  fetchDeleteNorm,
} from "@/api/norm";
import { FetchManagerStore } from "@/store/common/FetchManagerStore";
import { Response } from "@/types/api/common";
import { DailyNorm } from "@/types/norm/norm";

export class DailyNormFetchManager extends FetchManagerStore<DailyNorm> {
  protected fetchAll(): Promise<Response<DailyNorm[]>> {
    return fetchGetAllNorm();
  }

  protected fetchCreate(payload: DailyNorm): Promise<Response<DailyNorm>> {
    return fetchCreateNorm(payload);
  }

  protected fetchUpdate(
    id: number,
    payload: DailyNorm
  ): Promise<Response<DailyNorm>> {
    return fetchUpdateNorm(id, payload);
  }

  protected fetchDelete(id: number): Promise<Response<boolean>> {
    return fetchDeleteNorm(id);
  }
}

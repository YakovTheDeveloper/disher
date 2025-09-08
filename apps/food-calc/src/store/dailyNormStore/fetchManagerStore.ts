import {
  fetchCreateNorm,
  fetchGetAllNorm,
  fetchUpdateNorm,
  fetchDeleteNorm,
} from "@/api/norm";
import { FetchManagerStore } from "@/store/common/FetchManagerStore";
import { Response } from "@/types/api/common";
import { DailyNormV2 } from "@/types/norm/norm";

export class DailyNormFetchManager extends FetchManagerStore<DailyNormV2> {
  protected fetchAll(): Promise<Response<DailyNormV2[]>> {
    return fetchGetAllNorm();
  }

  protected fetchCreate(payload: DailyNormV2): Promise<Response<DailyNormV2>> {
    return fetchCreateNorm(payload);
  }

  protected fetchUpdate(
    id: number,
    payload: DailyNormV2
  ): Promise<Response<DailyNormV2>> {
    return fetchUpdateNorm(id, payload);
  }

  protected fetchDelete(id: number): Promise<Response<boolean>> {
    return fetchDeleteNorm(id);
  }
}

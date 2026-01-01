export interface IResponseData<T> {
    nonce: number;
    code: number;
    message?: string;
    data: T | null;
}
export declare function createResponseObject<T>(responseCode: number, message: string, data: T): IResponseData<T>;
//# sourceMappingURL=response.d.ts.map
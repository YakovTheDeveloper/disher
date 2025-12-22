export interface IResponseData<T> {
    nonce: number;
    code: number;
    message?: string;
    data: T | null;
}

export function createResponseObject<T>(
    responseCode: number,
    message: string,
    data: T
): IResponseData<T> {
    return {
        code: responseCode,
        nonce: Date.now(),
        message,
        data
    };
}

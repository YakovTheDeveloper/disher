export interface IResponseData<T> {
    nonce: number;
    code: number;
    message?: string;
    data: T | null;
}

export function createResponseObject<T = object>(responseCode: number, message: string, data: T): IResponseData<T> {
    const result: IResponseData<T> = {
        code: responseCode || 200,
        nonce: Date.now(),
        data: data || null
    };

    if (message) {
        result.message = message;
    }

    return result;
}
export interface IResponseData<T> {
    nonce: number;
    code: number;
    message?: string;
    data?: T;
}

export function createResponseObject<T = object>(responseCode: number, message: string, data: T): IResponseData<T> {
    const result: IResponseData<T> = {
        code: responseCode || 200,
        nonce: Date.now()
    };

    if (message) {
        result.message = message;
    }
    if (data) {
        result.data = data;
    }

    return result;
}
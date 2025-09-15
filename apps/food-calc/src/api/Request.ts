import { AbortSignal } from "abort-controller";

export type Response<T> = {
    code: number;
    nonce: number;
    message?: string;
    data?: T;
};

export type RequestOptions = {
    retries?: number;
    signal?: AbortSignal;
    retryDelay?: number;
};

export async function requestWrapper<
    TArgs extends any[],
    TResult extends Response<any>
>(
    apiFn: (...args: TArgs) => Promise<TResult>,
    options: RequestOptions,
    ...args: TArgs
): Promise<TResult & { nonce: number }> {
    const { retries = 0, signal, retryDelay = 500 } = options;
    let attempt = 0;
    const nonce = Date.now();

    while (true) {
        if (signal?.aborted) {
            return { code: 0, message: "Aborted", nonce } as TResult & { nonce: number };
        }

        try {
            const result = await apiFn(...args);
            return { ...result, nonce };
        } catch (err: any) {
            attempt++;
            if (attempt > retries || signal?.aborted) {
                return {
                    code: err?.code ?? 500,
                    message: err?.message ?? "Unknown error",
                    nonce,
                } as TResult & { nonce: number };
            }
            await new Promise((res) => setTimeout(res, retryDelay));
        }
    }
}

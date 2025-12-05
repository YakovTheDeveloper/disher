import { makeAutoObservable, runInAction } from "mobx";

//->status
export class RequestState {
    id: string
    loading = false;
    error: string | null = null;
    code: Code = -1

    constructor(id: string) {
        this.id = id
        this.start()
        makeAutoObservable(this);
    }

    start = () => {
        this.loading = true;
        this.error = null;
        return this
    }

    success(code?: Code) {
        this.loading = false;
        if (code) this.code = code
    }

    fail(err: unknown, code?: Code) {
        this.loading = false;
        this.error = err instanceof Error ? err.message : String(err);
        if (code) this.code = code
    }

    raw(): {
        isError: boolean,
        code: string | number
    } {
        if (this.error)
            return {
                isError: true,
                code: this.code
            }

        return {
            isError: false,
            code: this.code
        }
    }

    data(): ResponseStatus {
        if (this.error) {
            return [true, this.code];
        }
        return [false, this.code];
    }

    status(): ResponseStatus {
        if (this.error) {
            return [true, this.code];
        }
        return [false, this.code];
    }
}

type IsError = boolean
type Code = string | number
export type ResponseStatus = [IsError, Code]
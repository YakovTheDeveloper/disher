import { makeAutoObservable, runInAction } from "mobx";

//->status
export class RequestState {
    id: string
    loading = false;
    error: string | null = null;

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

    success() {
        this.loading = false;
    }

    fail(err: unknown) {
        this.loading = false;
        this.error = err instanceof Error ? err.message : String(err);
    }

    raw(): {
        isError: boolean,
        code: string | number
    } {
        if (this.error)
            return {
                isError: true,
                code: 0
            }

        return {
            isError: false,
            code: 0
        }
    }

    data(): [boolean, string | number] {
        if (this.error) {
            return [true, 0];
        }
        return [false, 0];
    }
}
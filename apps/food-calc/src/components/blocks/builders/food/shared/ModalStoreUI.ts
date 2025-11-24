import { makeAutoObservable } from "mobx";

export type CommonModals =
    | "food"
    | "quantity"
    | "nutrients";

export class ModalStoreUI<Variants> {
    constructor() {
        makeAutoObservable(this);
    }

    // NEW: internal stack
    private stack: Variants[] = [];

    // OLD API: works same as before
    get current(): Variants | null {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }

    // OLD API: sets a single modal (pushes to stack)
    set = (value: Variants | null) => {
        if (value === null) {
            this.stack = [];
        } else {
            this.stack.push(value);
        }
    }

    // OLD API: close current modal
    close = () => {
        this.stack.pop();
    }

    // OPTIONAL NEW HELPERS (do not break existing usage)

    /** Open multiple modals at once */
    push = (...values: Variants[]) => {
        this.stack.push(...values);
    }

    /** Close and return the top modal */
    pop = () => {
        return this.stack.pop();
    }

    /** Clear all modals */
    clear = () => {
        this.stack = [];
    }

    /** Get full stack if needed */
    get all() {
        return [...this.stack];
    }
}

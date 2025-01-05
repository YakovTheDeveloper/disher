import { InfiniteScrollStore } from "./InfiniteScrollStore"; // Adjust the path accordingly
import { IDish } from "@/types/dish/dish";
import { fetchGetAllDishes } from "@/api/dish";
import { makeAutoObservable, makeObservable } from "mobx";

export class PaginationStore {
    itemsCount = 0;
    limit = 5;
    offset = 0;
    finish = false;

    constructor() {
        makeAutoObservable(this);
    }

    setLimit = (limit: number) => this.limit = limit;
    setOffset = (offset: number) => this.offset = offset;
    setItemsCount = (count: number) => {
        this.itemsCount = count;
        this.checkFinish();
    };

    next = () => {
        const maxOffset = Math.max(0, this.itemsCount - this.limit);
        const newOffset = this.offset + this.limit;
        this.offset = Math.min(newOffset, maxOffset);
    };

    checkFinish = () => {
        // Finish when we have reached the last page of items,
        const finish = (this.limit + this.offset) > this.itemsCount
        console.log("finish", finish)
        console.log("finish", this.limit)
        console.log("finish", this.offset)
        console.log("finish", this.itemsCount)
        // accounting for cases where fewer than `limit` items are remaining.
        this.finish = finish
    };

    reset = () => {
        this.offset = 0;
        this.finish = false;
    };

    get params() {
        const { limit, offset } = this;
        return { limit, offset };
    }
}

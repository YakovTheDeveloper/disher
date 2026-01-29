import mitt from "mitt";

export type Emitter = typeof emitter & {
    events: {
        HIGHLIGHT_ITEM: { id: string | number };
    }
}

export const emitter = mitt<Emitter["events"]>()

export function highlightListItem(id: string) {
    emitter.emit('HIGHLIGHT_ITEM', { id });
}
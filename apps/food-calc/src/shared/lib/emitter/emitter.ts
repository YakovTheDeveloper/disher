import mitt from "mitt";

export type EmitterEvents = {
    HIGHLIGHT_ITEM: { id: string | number };
}

export const emitter = mitt<EmitterEvents>()

export function highlightListItem(id: string) {
    emitter.emit('HIGHLIGHT_ITEM', { id });
}

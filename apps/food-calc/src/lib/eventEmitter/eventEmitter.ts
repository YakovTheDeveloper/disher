// eventEmitter.ts
type EventName = "RECALCULATE_NUTRIENTS";
type Listener = () => void;

export class EventEmitter {
    private listeners: Map<EventName, Set<Listener>> = new Map();

    on(event: EventName, listener: Listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    off(event: EventName, listener: Listener) {
        this.listeners.get(event)?.delete(listener);
    }

    emit(event: EventName) {
        this.listeners.get(event)?.forEach((listener) => listener());
    }
}

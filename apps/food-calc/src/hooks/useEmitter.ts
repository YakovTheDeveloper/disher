import { useEffect, useRef } from 'react';
import { emitter, type EmitterEvents } from '@/infrastructure/emitter/emitter';

type EventName = keyof EmitterEvents;
type Callback = (data: unknown) => void;

/**
 * Hook that subscribes to an emitter event and automatically unsubscribes on unmount.
 * Hides the implementation of setting up listener (emitter.on) and cleanup (emitter.off).
 *
 * @param eventName - Name of the event to listen to
 * @param callback - Callback function (should be stable - wrap with useCallback)
 */
export function useEmitter(eventName: EventName, callback: Callback) {
    const callbackRef = useRef(callback);

    // Обновляем ref при изменении callback, чтобы всегда использовать актуальную версию
    callbackRef.current = callback;

    useEffect(() => {
        const handler = (data: unknown) => callbackRef.current(data);

        emitter.on(eventName, handler as any);

        return () => {
            emitter.off(eventName, handler as any);
        };
    }, [eventName]);
}

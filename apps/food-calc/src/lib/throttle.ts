type ThrottledFn<T extends (...args: any[]) => void> = ((...args: Parameters<T>) => void) & { cancel: () => void };

export function throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): ThrottledFn<T> {
    let lastCall = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const throttled: ThrottledFn<T> = Object.assign(
        function (...args: Parameters<T>) {
            const now = Date.now();

            if (now - lastCall >= delay) {
                lastCall = now;
                func(...args);
            } else {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    lastCall = Date.now();
                    timer = null;
                    func(...args);
                }, delay - (now - lastCall));
            }
        } as (...args: Parameters<T>) => void,
        {
            cancel: () => {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            },
        }
    );

    return throttled;
}

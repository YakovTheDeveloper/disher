export { };

declare global {
    interface Window {
        log: (message: string, color?: string) => void;
    }

    var log: (message: string, color?: string) => void;
}
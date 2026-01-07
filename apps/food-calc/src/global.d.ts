declare module "*.svg" {
    const content: any;
    export default content;
}

export { };

declare global {
    interface Window {
        log: (message: string, color?: string) => void;
    }

    var log: (message: string, color?: string) => void;
}
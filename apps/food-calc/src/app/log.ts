export function setupGlobalLog() {
    const defaultStyle = 'color: white; background-color: #4CAF50; font-weight: bold; padding: 2px 6px; border-radius: 4px;';

    // window.log
    window.log = (message: string, color?: string) => {
        const style = color
            ? `color: ${color}; background-color: #222; font-weight: bold; padding: 2px 6px; border-radius: 4px;`
            : defaultStyle;
        console.log('%c' + message, style); // eslint-disable-line no-console
    };

    globalThis.log = window.log;
}

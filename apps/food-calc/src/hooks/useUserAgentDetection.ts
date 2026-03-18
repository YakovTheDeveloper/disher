import { useEffect } from 'react';

interface UserAgentInfo {
    isIOS: boolean;
    isAndroid: boolean;
    engine: string;
    supportsAutofocus: boolean;
}

let cachedInfo: UserAgentInfo | null = null;

function detectUserAgent(): UserAgentInfo {
    if (cachedInfo) return cachedInfo;

    const ua = navigator.userAgent;

    const isIOS = /(iPhone|iPad|iPod)/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    let engine = '';
    if (/webkit/i.test(ua)) engine = 'WebKit';
    else if (/blink/i.test(ua)) engine = 'Blink';
    else if (/gecko/i.test(ua)) engine = 'Gecko';
    else engine = 'Unknown';

    const supportsAutofocus = !isIOS;

    cachedInfo = { isIOS, isAndroid, engine, supportsAutofocus };
    return cachedInfo;
}

export const userAgentInfo = detectUserAgent();

export const useUserAgentDetection = () => {
    // Detection is now synchronous and cached — no store needed.
    // Hook kept for API compatibility with existing call sites.
    useEffect(() => {
        detectUserAgent();
    }, []);
};

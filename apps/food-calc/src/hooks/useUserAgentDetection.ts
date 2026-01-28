import { useEffect } from 'react';
import { domainStore } from '@/store/store';

export const useUserAgentDetection = () => {
    useEffect(() => {
        const ua = navigator.userAgent;

        const isIOS = /(iPhone|iPad|iPod)/i.test(ua);
        const isAndroid = /Android/i.test(ua);

        let engine = '';
        if (/webkit/i.test(ua)) engine = 'WebKit';
        else if (/blink/i.test(ua)) engine = 'Blink';
        else if (/gecko/i.test(ua)) engine = 'Gecko';
        else engine = 'Unknown';

        const supportsAutofocus = !isIOS;

        domainStore.globalUiStore.userAgentStore.setIsIOS(isIOS);
        domainStore.globalUiStore.userAgentStore.setIsAndroid(isAndroid);
        domainStore.globalUiStore.userAgentStore.setEngine(engine);
        domainStore.globalUiStore.userAgentStore.setSupportsAutofocus(supportsAutofocus);
    }, []);
};
import { useRef, useCallback, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';

const pad2 = (n: number | string) => String(n).padStart(2, '0');
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const getDigits = (s: string) => (s || '').replace(/\D/g, '');

interface TimePickerParams {
    hours: string;
    minutes: string;
    setHours: (val: string) => void;
    setMinutes: (val: string) => void;
    onChange?: (val: string) => void;
    onFinish?: (val: string) => void;
}

export const useTimePicker = ({
    hours,
    minutes,
    setHours,
    setMinutes,
    onChange,
    onFinish,
}: TimePickerParams) => {
    const hhRef = useRef<HTMLInputElement>(null);
    const mmRef = useRef<HTMLInputElement>(null);

    // Helper to sync the parent state string "HH:MM"
    const syncParent = useCallback((h: string, m: string) => {
        onChange?.(`${pad2(h || '0')}:${pad2(m || '0')} `);
    }, [onChange]);

    const handleHoursChange = (e: ChangeEvent<HTMLInputElement>) => {
        const raw = getDigits(e.target.value);
        const val = raw.slice(-2); // Take last 2 digits entered

        if (!val) {
            setHours('');
            return;
        }

        const num = Number(val);

        // LOGIC: When to jump to minutes?
        // 1. If it's a single digit > 2 (e.g., user types '3', it must be '03')
        if (val.length === 1 && num > 2) {
            const formatted = pad2(num);
            setHours(formatted);
            syncParent(formatted, minutes);
            mmRef.current?.focus();
            mmRef.current?.select();
        }
        // 2. If it's two digits
        else if (val.length === 2) {
            const clipped = pad2(clamp(num, 0, 23));
            setHours(clipped);
            syncParent(clipped, minutes);
            mmRef.current?.focus();
            mmRef.current?.select();
        }
        // 3. User typed '0', '1', or '2' -> wait for second digit
        else {
            setHours(val);
        }
    };

    const handleMinutesChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = getDigits(e.target.value).slice(-2);
        setMinutes(val);

        if (val.length === 2) {
            const clipped = pad2(clamp(Number(val), 0, 59));
            setMinutes(clipped);
            syncParent(hours, clipped);
            onFinish?.(`${pad2(hours)}:${clipped} `);
        }
    };

    const handleBlur = () => {
        const h = hours ? pad2(clamp(Number(hours), 0, 23)) : '00';
        const m = minutes ? pad2(clamp(Number(minutes), 0, 59)) : '00';
        setHours(h);
        setMinutes(m);
        syncParent(h, m);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, type: 'h' | 'm') => {
        if (e.key === 'ArrowRight' && type === 'h') {
            mmRef.current?.focus();
            mmRef.current?.select();
        }
        if (e.key === 'ArrowLeft' && type === 'm') {
            hhRef.current?.focus();
            hhRef.current?.select();
        }
        if (e.key === 'Backspace' && type === 'm' && !minutes) {
            e.preventDefault();
            hhRef.current?.focus();
            // Optional: clear last hour digit when jumping back
            setHours(prev => prev.slice(0, -1));
        }
    };

    const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
        const data = getDigits(e.clipboardData.getData('text'));
        if (data.length >= 3) {
            const h = pad2(clamp(Number(data.slice(0, 2)), 0, 23));
            const m = pad2(clamp(Number(data.slice(2, 4)), 0, 59));
            setHours(h); setMinutes(m);
            syncParent(h, m);
            onFinish?.(`${h}:${m} `);
            mmRef.current?.blur();
        }
    };

    const adjust = () => {

    }

    return {
        hhRef, mmRef,
        hoursProps: {
            value: hours,
            onChange: handleHoursChange,
            onKeyDown: (e: any) => handleKeyDown(e, 'h'),
            onBlur: handleBlur,
            onPaste: handlePaste,
            maxLength: 2,
        },
        minutesProps: {
            value: minutes,
            onChange: handleMinutesChange,
            onKeyDown: (e: any) => handleKeyDown(e, 'm'),
            onBlur: handleBlur,
            onPaste: handlePaste,
            maxLength: 2,
        },
        containerProps: {
            onClick: (e: React.MouseEvent) => {
                // Only focus if clicking the container background, not the inputs
                if ((e.target as HTMLElement).tagName !== 'INPUT') {
                    hhRef.current?.focus();
                    hhRef.current?.select();
                }
            }
        },
        controls: {
            incH: () => adjust('h', 1),
            decH: () => adjust('h', -1),
            incM: () => adjust('m', 5),
            decM: () => adjust('m', -5),
        },
    };
};
import { useRef } from 'react';

const pad2 = (n: number) => String(n).padStart(2, '0');
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const digits = (s: string) => (s || '').replace(/\D/g, '');

/**
 * Parse common paste formats: "HHMM", "HH:MM", "H:MM", "HMM", "HHMMSS"
 */
function parseMaybeBoth(s: string): { hh?: string; mm?: string } {
    const d = digits(s);
    if (d.length >= 4) {
        return { hh: d.slice(0, 2), mm: d.slice(2, 4) };
    }
    if (d.length === 3) {
        // e.g. "123" -> "1","23"
        return { hh: d.slice(0, 1), mm: d.slice(1, 3) };
    }
    if (d.length === 2) {
        // ambiguous: could be HH or MM — treat as HH (user pasted "12")
        return { hh: d };
    }
    if (d.length === 1) {
        return { hh: d };
    }
    return {};
}

const normalize = (hhRaw: string, mmRaw: string) => {
    const hNum = hhRaw === '' ? 0 : clamp(Number(hhRaw), 0, 23);
    const mNum = mmRaw === '' ? 0 : clamp(Number(mmRaw), 0, 59);
    return `${pad2(hNum)}:${pad2(mNum)}`;
};

type Params = {
    hours: string;
    minutes: string;
    setHours: (value: string) => void;
    setMinutes: (value: string) => void;
    onFinish: (value: string) => void; // REQUIRED - fires when user enters 4 digits
};

/**
 * Minimal time picker hook for TimeChoose V2
 * User enters 4 digits (HHMM) and onFinish fires automatically
 * Handles edge cases:
 * - Smart single-digit auto-advance (3+ in hours field)
 * - Auto-focus from hours to minutes
 * - Backspace navigation
 * - Paste format detection
 */
export const useTimeChooseV2 = ({
    hours,
    minutes,
    setHours,
    setMinutes,
    onFinish,
}: Params) => {
    const hhRef = useRef<HTMLInputElement | null>(null);
    const mmRef = useRef<HTMLInputElement | null>(null);

    /**
     * Finish and call onFinish callback
     */
    const finishAndBlur = (h: string, m: string) => {
        const norm = normalize(h || '0', m || '0');
        onFinish(norm);
        mmRef.current?.blur();
    };

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawDigits = digits(e.target.value);

        // Limit to 2 digits
        const raw = rawDigits.slice(0, 2);

        // Handle paste: "12:34" or "1234"
        const pasted = parseMaybeBoth(e.target.value);
        if (
            pasted.hh !== undefined &&
            pasted.mm !== undefined &&
            rawDigits.length >= 3
        ) {
            const hh = pad2(clamp(Number(pasted.hh), 0, 23));
            const mm = pad2(clamp(Number(pasted.mm), 0, 59));
            setHours(hh);
            setMinutes(mm);
            // Auto-finish if both fields populated from paste
            setTimeout(() => finishAndBlur(hh, mm), 0);
            return;
        }

        // === 24-hour smart logic for single digit input ===
        if (raw.length === 1) {
            const d = Number(raw);

            // If digit >= 3: impossible for first digit of valid hour (00-23)
            // Auto-pad and jump to minutes field
            if (d >= 3) {
                const hh = pad2(d); // "3" -> "03"
                setHours(hh);
                // Auto-focus to minutes immediately
                setTimeout(() => {
                    mmRef.current?.focus();
                    mmRef.current?.select();
                }, 0);
                return;
            }

            // If 0, 1, or 2: wait for second digit
            setHours(raw);
            return;
        }

        // Two digits entered
        if (raw.length === 2) {
            // Clamp to 0-23
            const fixed = pad2(clamp(Number(raw), 0, 23));
            setHours(fixed);

            // Auto-jump to minutes
            setTimeout(() => {
                mmRef.current?.focus();
                mmRef.current?.select();
            }, 0);
            return;
        }
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = digits(e.target.value).slice(0, 2);

        // Handle paste that included both values
        const pasted = parseMaybeBoth(e.target.value);
        if (
            pasted.hh !== undefined &&
            pasted.mm !== undefined &&
            digits(e.target.value).length >= 3
        ) {
            const hh = pad2(clamp(Number(pasted.hh), 0, 23));
            const mm = pad2(clamp(Number(pasted.mm), 0, 59));
            setHours(hh);
            setMinutes(mm);
            setTimeout(() => finishAndBlur(hh, mm), 0);
            return;
        }

        setMinutes(raw);

        // When 2 digits entered: clamp and finish
        if (raw.length === 2) {
            const mmFormatted = pad2(clamp(Number(raw), 0, 59));
            setMinutes(mmFormatted);
            // Fire onFinish after state update
            setTimeout(() => {
                finishAndBlur(hours || '0', mmFormatted);
            }, 0);
        }
    };

    const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Arrow right: jump to minutes
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            mmRef.current?.focus();
            mmRef.current?.select();
            return;
        }

        // Tab: also jump to minutes
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            mmRef.current?.focus();
            mmRef.current?.select();
            return;
        }
    };

    const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Arrow left: jump back to hours
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            hhRef.current?.focus();
            hhRef.current?.select();
            return;
        }

        // Shift+Tab: jump back to hours
        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            hhRef.current?.focus();
            hhRef.current?.select();
            return;
        }

        // Backspace: if at start of minutes, go back and delete from hours
        if (e.key === 'Backspace') {
            const target = e.target as HTMLInputElement;
            const selStart = target.selectionStart ?? 0;
            const selEnd = target.selectionEnd ?? 0;

            if (minutes.length === 0 || (selStart === 0 && selEnd === 0)) {
                e.preventDefault();
                // Move focus to hours and remove last char
                hhRef.current?.focus();
                setHours(hours.slice(0, -1));
                // Place caret at end
                const hh = hhRef.current;
                if (hh) {
                    const len = hh.value.length;
                    setTimeout(() => {
                        hh.setSelectionRange(len - 1, len - 1);
                    }, 0);
                }
            }
        }
    };

    const handleHoursBlur = () => {
        if (hours.length === 0) {
            setHours('00');
        } else if (hours.length === 1) {
            // Keep single digit visually, but it will be formatted on finish
        }
    };

    const handleMinutesBlur = () => {
        if (minutes.length > 0 && minutes.length < 2) {
            const mmFormatted = pad2(clamp(Number(minutes || '0'), 0, 59));
            setMinutes(mmFormatted);
        } else if (minutes.length === 0) {
            setMinutes('00');
        }
    };

    return {
        hhRef,
        mmRef,
        handleHoursChange,
        handleMinutesChange,
        handleHoursKeyDown,
        handleMinutesKeyDown,
        handleHoursBlur,
        handleMinutesBlur,
    };
};

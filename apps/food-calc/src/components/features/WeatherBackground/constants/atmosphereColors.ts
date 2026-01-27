/**
 * Atmospheric color palettes for different times of day
 * Each period has gradient stops for smooth visual transitions
 */

export type AtmospherePeriod = 'night' | 'earlyMorning' | 'morning' | 'day' | 'evening';

export interface AtmosphereColors {
    sky: {
        top: string;
        middle: string;
        bottom: string;
        horizon: string;
    };
    sun: {
        color: string;
        glow: string;
    };
    moon: {
        color: string;
        glow: string;
    };
    clouds: {
        light: string;
        medium: string;
        dark: string;
    };
    stars: {
        opacity: number;
        tint: string;
    };
    lighting: {
        ambient: string;
        brightness: number;
    };
}

// Morning: 07:00 - 09:59 (bright morning freshness) - Soft warm pastels
export const MORNING_COLORS: AtmosphereColors = {
    sky: {
        top: 'rgb(211, 227, 243)',       // Soft pale blue
        middle: 'rgb(227, 239, 249)',    // Light sky blue
        bottom: 'rgb(243, 239, 227)',    // Gentle warm cream
        horizon: 'rgb(255, 235, 211)',   // Soft apricot
    },
    sun: {
        color: 'rgb(255, 219, 171)',     // Warm pastel yellow-orange
        glow: 'rgba(255, 227, 187, 0.22)', // Soft warm glow
    },
    moon: {
        color: 'rgba(255, 255, 255, 0)', // Invisible
        glow: 'rgba(255, 255, 255, 0)',
    },
    clouds: {
        light: 'rgba(255, 243, 227, 0.65)',
        medium: 'rgba(247, 231, 203, 0.42)',
        dark: 'rgba(227, 211, 179, 0.18)',
    },
    stars: {
        opacity: 0,
        tint: 'rgba(255, 255, 255, 0)',
    },
    lighting: {
        ambient: 'rgba(255, 231, 195, 0.12)',
        brightness: 0.6,
    },
};

// Day: 10:00 - 17:59 (bright daylight) - Pastel palette with soft blues
export const DAY_COLORS: AtmosphereColors = {
    sky: {
        top: 'rgb(211, 231, 247)',       // Soft blue
        middle: 'rgb(227, 239, 251)',    // Pale sky blue
        bottom: 'rgb(243, 250, 251)',    // Very light blue
        horizon: 'rgb(243, 247, 254)',   // Whisper blue
    },
    sun: {
        color: 'rgb(255, 247, 211)',     // Soft golden yellow
        glow: 'rgba(255, 251, 227, 0.15)', // Gentle glow
    },
    moon: {
        color: 'rgba(255, 255, 255, 0)', // Invisible
        glow: 'rgba(255, 255, 255, 0)',
    },
    clouds: {
        light: 'rgba(251, 251, 249, 0.8)',
        medium: 'rgba(235, 243, 249, 0.5)',
        dark: 'rgba(211, 227, 243, 0.25)',
    },
    stars: {
        opacity: 0,
        tint: 'rgba(255, 255, 255, 0)',
    },
    lighting: {
        ambient: 'rgba(255, 247, 227, 0.08)',
        brightness: 0.95,
    },
};

// Evening: 18:00 - 20:59 (golden hour → dusk) - Warm pastel romance
export const EVENING_COLORS: AtmosphereColors = {
    sky: {
        top: 'rgb(235, 203, 195)',       // Soft mauve-rose
        middle: 'rgb(247, 219, 187)',    // Pale peachy gold
        bottom: 'rgb(251, 227, 195)',    // Gentle apricot
        horizon: 'rgb(255, 231, 203)',   // Soft cream-gold
    },
    sun: {
        color: 'rgb(255, 195, 147)',     // Warm pastel orange
        glow: 'rgba(255, 211, 171, 0.3)', // Subtle golden glow
    },
    moon: {
        color: 'rgba(243, 243, 227, 0.5)', // Soft pale moon
        glow: 'rgba(227, 227, 211, 0.1)',
    },
    clouds: {
        light: 'rgba(255, 227, 203, 0.7)',
        medium: 'rgba(251, 211, 179, 0.45)',
        dark: 'rgba(235, 187, 155, 0.2)',
    },
    stars: {
        opacity: 0.15,
        tint: 'rgba(255, 227, 203, 0.25)',
    },
    lighting: {
        ambient: 'rgba(255, 195, 155, 0.2)',
        brightness: 0.55,
    },
};

// Night: 22:00 - 03:59 (serene starry night) - Soft deep palette
export const NIGHT_COLORS: AtmosphereColors = {
    sky: {
        top: 'rgb(83, 91, 139)',          // Very deep soft blue
        middle: 'rgb(95, 107, 147)',      // Soft navy indigo
        bottom: 'rgb(107, 123, 155)',      // Subtle deep blue
        horizon: 'rgb(115, 131, 171)',     // Soft twilight blue
    },
    sun: {
        color: 'rgba(255, 255, 255, 0)', // Invisible
        glow: 'rgba(255, 255, 255, 0)',
    },
    moon: {
        color: 'rgb(243, 243, 231)',     // Soft pale moon
        glow: 'rgba(227, 227, 211, 0.2)', // Gentle luminescence
    },
    clouds: {
        light: 'rgba(131, 147, 187, 0.3)',
        medium: 'rgba(107, 123, 163, 0.2)',
        dark: 'rgba(91, 99, 139, 0.1)',
    },
    stars: {
        opacity: 0.7,
        tint: 'rgba(211, 227, 243, 0.6)',
    },
    lighting: {
        ambient: 'rgba(147, 163, 195, 0.1)',
        brightness: 0.2,
    },
};

// Early Morning: 04:00 - 06:59 (dawn awakening) - Soft subtle pastels
export const EARLY_MORNING_COLORS: AtmosphereColors = {
    sky: {
        top: 'rgb(187, 199, 219)',       // Pale cool lavender
        middle: 'rgb(211, 219, 235)',    // Soft periwinkle
        bottom: 'rgb(235, 227, 223)',    // Gentle warm beige
        horizon: 'rgb(247, 231, 211)',   // Soft peachy-gold
    },
    sun: {
        color: 'rgb(255, 211, 163)',     // Warm pastel orange
        glow: 'rgba(255, 219, 179, 0.2)', // Subtle early glow
    },
    moon: {
        color: 'rgba(243, 243, 227, 0.3)', // Fading moon
        glow: 'rgba(227, 227, 211, 0.1)',
    },
    clouds: {
        light: 'rgba(247, 231, 203, 0.5)',
        medium: 'rgba(235, 219, 195, 0.3)',
        dark: 'rgba(219, 203, 179, 0.15)',
    },
    stars: {
        opacity: 0.2,
        tint: 'rgba(243, 227, 203, 0.2)',
    },
    lighting: {
        ambient: 'rgba(255, 219, 179, 0.12)',
        brightness: 0.4,
    },
};

/**
 * Get atmosphere colors for a given time period
 */
export const getAtmosphereColors = (period: AtmospherePeriod): AtmosphereColors => {
    switch (period) {
        case 'night':
            return NIGHT_COLORS;
        case 'earlyMorning':
            return EARLY_MORNING_COLORS;
        case 'morning':
            return MORNING_COLORS;
        case 'day':
            return DAY_COLORS;
        case 'evening':
            return EVENING_COLORS;
        default:
            return DAY_COLORS;
    }
};

/**
 * Interpolate between two colors (linear RGB interpolation)
 * @param color1 - rgb(r, g, b) string
 * @param color2 - rgb(r, g, b) string
 * @param progress - 0 to 1
 */
export const interpolateColor = (
    color1: string,
    color2: string,
    progress: number
): string => {
    const parseRgb = (str: string) => {
        const match = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return [0, 0, 0];
        return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
    };

    const [r1, g1, b1] = parseRgb(color1);
    const [r2, g2, b2] = parseRgb(color2);

    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);

    return `rgb(${r}, ${g}, ${b})`;
};

# Weather Background Component

A realistic, performant animated atmospheric background for React applications. Displays time-based visual atmospheres (dawn/noon/sunset/night) with animated sky gradients, clouds, celestial bodies, and weather effects.

## Features

✨ **Visual Features:**

- Time-based atmospheric transitions (dawn → noon → sunset → night)
- Multi-layered animated clouds with parallax effect
- Sun/moon positioned based on time with realistic arc movement
- Twinkling starfield visible at night
- Dynamic weather effects (rain, snow, fog, clear)
- Glassmorphism support with smooth gradients
- Native iOS/Android weather widget aesthetic

⚡ **Performance Optimizations:**

- GPU-accelerated CSS animations with `will-change` hints
- Efficient Canvas 2D rendering for particles and effects
- Frame skipping on low-power devices
- Respects `prefers-reduced-motion` accessibility setting
- Automatic quality degradation on low-end hardware
- Battery saver mode detection

📱 **Responsive & Accessible:**

- Fills parent container (flexible sizing)
- Safe-area-inset support for notched devices
- Works seamlessly in PWAs
- No scroll-jank on mobile
- CSS containment for performance isolation

## Installation

The component is already integrated into the project. Required dependencies:

- `framer-motion` (already installed)
- React 16.8+ (hooks support)

## Usage

### Basic Usage

```tsx
import WeatherBackground from '@/components/features/WeatherBackground';

export function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <WeatherBackground time="14:30" weatherType="clear" />
    </div>
  );
}
```

### Props

```tsx
interface WeatherBackgroundProps {
  /**
   * Time in 'HH:MM' format (24-hour)
   * If not provided, uses current browser time
   * Default: '12:00' (noon) if current time unavailable
   */
  time?: string;

  /**
   * Weather type to display
   * @default 'clear'
   */
  weatherType?: 'clear' | 'cloudy' | 'rainy' | 'snowy';

  /**
   * Additional CSS class for container
   */
  className?: string;
}
```

### Examples

#### Full Page Background

```tsx
<WeatherBackground time="19:45" weatherType="clear" />
```

#### Responsive Container

```tsx
<div style={{ position: 'relative', width: '100%', height: '400px', overflow: 'hidden' }}>
  <WeatherBackground time="06:30" weatherType="cloudy" />
</div>
```

#### Dynamic Updates

```tsx
function DynamicWeather() {
  const [time, setTime] = useState('12:00');
  const [weather, setWeather] = useState<WeatherType>('clear');

  return (
    <div>
      <WeatherBackground time={time} weatherType={weather} />
      <button onClick={() => setTime(getNextHour())}>Next Hour</button>
    </div>
  );
}
```

## Atmospheric States

### Dawn (6:00 - 11:59)

- Orange-peach sky with blue tints
- Sunrise positioning
- Moderate cloud opacity
- Stars fading out

### Noon (12:00 - 17:59)

- Bright blue sky
- High noon sun positioning
- Lower cloud opacity
- No stars

### Sunset (18:00 - 20:59)

- Golden-orange sky transitioning to purple
- Sun descending toward horizon
- High cloud opacity with warm tones
- Moon faintly visible
- Stars beginning to appear

### Night (21:00 - 5:59)

- Deep navy-blue sky
- Moon high in sky
- Full starfield with twinkling
- Low cloud opacity with bluish tones

## Component Architecture

```
WeatherBackground/
├── index.tsx                    # Main component
├── WeatherBackground.module.scss # Styles
├── constants/
│   └── atmosphereColors.ts     # Time-of-day color palettes
├── layers/
│   ├── SkyGradient.tsx         # Base gradient layer
│   ├── Clouds.tsx              # Animated clouds (Canvas)
│   ├── CelestialBodies.tsx     # Sun/Moon/Stars (Canvas)
│   └── WeatherEffects.tsx      # Rain/Snow/Fog (Canvas)
└── WeatherBackgroundDemo.tsx   # Usage example
```

## Performance Considerations

### Device Detection

The component automatically detects and adapts to:

- Low device memory (`deviceMemory < 4GB`)
- Data saver mode enabled
- Battery saver/low-power mode
- Reduced motion preferences
- Device pixel ratio (Retina displays)

### Optimization Techniques

1. **Canvas Rendering** - Uses Canvas 2D for efficient particle rendering instead of DOM elements
2. **Frame Skipping** - On low-power devices, skips every other frame for particle updates
3. **Layer Reduction** - Reduces cloud layers from 3 to 2 on low-power devices
4. **GPU Acceleration** - Uses CSS `transform: translateZ(0)` and `will-change` for hardware acceleration
5. **Containment** - CSS `contain: layout style paint` isolates component rendering
6. **ResizeObserver** - Efficiently detects canvas size changes without layout thrashing

### Browser APIs Used

- `ResizeObserver` - For canvas size tracking
- `requestAnimationFrame` - For smooth 60fps animations
- `matchMedia` - For `prefers-reduced-motion` and color scheme detection
- `IntersectionObserver` - For visibility detection (optional, extensible)
- `Canvas 2D API` - For particle rendering
- `Battery API` - For low-power detection (limited support)
- `Device Memory API` - For hardware capability detection

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- iOS Safari: 14+
- Android: Chrome 90+

> Gracefully degrades on older browsers with CSS fallbacks

## Accessibility

### Motion Preferences

The component respects `prefers-reduced-motion: reduce`:

- Disables all animations
- Transitions become instant (0.01ms)
- Still visually presents the appropriate atmospheric state

### Color Scheme

Respects `prefers-color-scheme: dark` with slight brightness adjustment

### Touch Friendly

- No hover-dependent interactions
- Touch events propagate normally
- No scroll-jank on mobile

## Customization

### Extending Atmosphere Colors

Edit `constants/atmosphereColors.ts` to modify time-of-day palettes:

```tsx
export const CUSTOM_COLORS: AtmosphereColors = {
  sky: {
    top: 'rgb(150, 200, 255)',
    middle: 'rgb(200, 230, 255)',
    bottom: 'rgb(220, 240, 255)',
    horizon: 'rgb(240, 250, 255)',
  },
  // ... more colors
};
```

### Adding Custom Weather Effects

Extend `WeatherEffects.tsx` with new particle systems:

```tsx
} else if (weatherType === 'hail') {
  // Custom hail particle rendering
  ctx.fillStyle = 'rgba(200, 200, 255, 0.9)';
  // ... render particles
}
```

### Adjusting Animation Speeds

Modify cloud speeds or star twinkle rates in respective layer components:

```tsx
const layers = [
  {
    speed: 0.3, // Adjust this value
    opacity: 0.8,
    // ...
  },
];
```

## Troubleshooting

### Component not rendering

Ensure the parent container has a defined height:

```tsx
<div style={{ height: '100vh' }}>
  <WeatherBackground />
</div>
```

### High CPU usage

- Check `prefers-reduced-motion` is respected in system settings
- Verify device doesn't have `save-data` enabled
- Monitor with DevTools Performance tab

### Canvas appears blurry on mobile

This is typically a DPI/pixel ratio issue. The component auto-detects, but you can force sharper rendering with:

```scss
canvas {
  image-rendering: crisp-edges;
}
```

### Stars not visible

Stars only appear during night hours (21:00 - 5:59). Test with `time="23:00"`

## Future Enhancements

- [ ] Three.js integration for advanced 3D effects
- [ ] Configurable wind/weather data from API
- [ ] Custom color themes
- [ ] Lightning effects for storms
- [ ] Aurora borealis (northern lights) night effect
- [ ] Sound effects (optional)
- [ ] Historical weather visualization

## License

MIT (part of disher project)

## Related Files

- Main component: [index.tsx](./index.tsx)
- Utilities: [@/lib/time/parseTime.ts](../../lib/time/parseTime.ts)
- Hooks: [@/hooks/usePerformanceOptimization.ts](../../hooks/usePerformanceOptimization.ts)
- Demo: [WeatherBackgroundDemo.tsx](./WeatherBackgroundDemo.tsx)

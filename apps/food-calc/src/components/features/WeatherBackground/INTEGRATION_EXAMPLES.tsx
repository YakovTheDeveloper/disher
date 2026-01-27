/**
 * Integration guide for WeatherBackground component
 * 
 * This file shows different ways to integrate the WeatherBackground
 * component into your existing React application.
 */

// ============================================================
// Option 1: Full Page Background (Recommended for initial setup)
// ============================================================

import React from 'react';
import WeatherBackground from '@/components/features/WeatherBackground';

export function AppWithFullPageWeather() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Beautiful atmospheric background */}
      <WeatherBackground time="14:30" weatherType="clear" />

      {/* Your app content on top */}
      <div style={{ position: 'relative', zIndex: 10, color: 'white' }}>
        <h1>Your App Content Here</h1>
      </div>
    </div>
  );
}

// ============================================================
// Option 2: Dynamic Time Updates
// ============================================================

import { useState, useEffect } from 'react';

export function AppWithLiveWeather() {
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <WeatherBackground time={currentTime} weatherType="cloudy" />
      {/* Content */}
    </div>
  );
}

// ============================================================
// Option 3: With MobX Store Integration
// ============================================================

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

interface TimeStore {
  currentTime: string;
  currentWeather: 'clear' | 'cloudy' | 'rainy' | 'snowy';
}

const TimeStoreContext = React.createContext<TimeStore | null>(null);

@observer
export function AppWithStoreWeather() {
  const store = useContext(TimeStoreContext);

  if (!store) return null;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <WeatherBackground time={store.currentTime} weatherType={store.currentWeather} />
      {/* Content */}
    </div>
  );
}

// ============================================================
// Option 4: Responsive Container
// ============================================================

export function AppWithResponsiveWeather() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* Weather background section - 40% of viewport */}
      <div
        style={{
          position: 'relative',
          height: '40vh',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <WeatherBackground time="18:00" weatherType="clear" />
      </div>

      {/* Content section - 60% of viewport */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'white',
        }}
      >
        <div style={{ padding: '20px' }}>
          <h1>Your Content</h1>
          {/* App content here */}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Option 5: With Weather Selection UI
// ============================================================

import type { WeatherType } from '@/components/features/WeatherBackground/layers/WeatherEffects';

export function AppWithWeatherControls() {
  const [time, setTime] = React.useState('12:00');
  const [weather, setWeather] = React.useState<WeatherType>('clear');

  const weatherOptions: WeatherType[] = ['clear', 'cloudy', 'rainy', 'snowy'];

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {/* Background */}
      <WeatherBackground time={time} weatherType={weather} />

      {/* Control Panel */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 100,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white',
        }}
      >
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Time:
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '10px' }}>
          Weather:
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value as WeatherType)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            {weatherOptions.map((w) => (
              <option key={w} value={w}>
                {w.charAt(0).toUpperCase() + w.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

// ============================================================
// Option 6: As Part of Header/Hero Section
// ============================================================

export function AppWithHeroWeather() {
  return (
    <div>
      {/* Hero section with weather background */}
      <div style={{ position: 'relative', height: '500px', overflow: 'hidden' }}>
        <WeatherBackground time="07:00" weatherType="clear" />

        {/* Text overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white',
            zIndex: 10,
          }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>Welcome</h1>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>Beautiful morning atmosphere</p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '40px' }}>
        <h2>Your App Content</h2>
        {/* Content here */}
      </div>
    </div>
  );
}

// ============================================================
// Option 7: Simple Integration (Copy-Paste Ready)
// ============================================================

// Just add this to your App.tsx or main layout:
export function SimpleIntegration() {
  return (
    <main style={{ width: '100%', height: '100vh' }}>
      <WeatherBackground 
        time={new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
        weatherType="clear"
      />
    </main>
  );
}

// ============================================================
// Integration with your existing store (if applicable)
// ============================================================

/**
 * If you're using MobX State Tree (based on project structure),
 * add this to your store:
 */

/*
// In your root store
const WeatherStore = types
  .model('WeatherStore', {
    currentTime: types.optional(types.string, '12:00'),
    weatherType: types.optional(types.enumeration(['clear', 'cloudy', 'rainy', 'snowy']), 'clear'),
  })
  .actions((self) => ({
    setTime(time: string) {
      self.currentTime = time;
    },
    setWeather(type: 'clear' | 'cloudy' | 'rainy' | 'snowy') {
      self.weatherType = type;
    },
    updateCurrentTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      self.currentTime = `${hours}:${minutes}`;
    },
  }));

// Then use it:
// <WeatherBackground 
//   time={store.weatherStore.currentTime}
//   weatherType={store.weatherStore.weatherType}
// />
*/

export default AppWithFullPageWeather;

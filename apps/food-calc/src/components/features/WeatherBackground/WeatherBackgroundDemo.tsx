/**
 * WeatherBackground Component Usage Example
 *
 * This file demonstrates how to use the WeatherBackground component
 * in your application.
 */

import React, { useState } from 'react';
import WeatherBackground from '@/components/features/WeatherBackground';
import type { WeatherType } from '@/components/features/WeatherBackground/layers/WeatherEffects';

export const WeatherBackgroundDemo: React.FC = () => {
  const [time, setTime] = useState('12:00');
  const [weatherType, setWeatherType] = useState<WeatherType>('clear');

  const weatherTypes: WeatherType[] = ['clear', 'cloudy', 'rainy', 'snowy'];

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Background component fills the container */}
      <WeatherBackground time={time} weatherType={weatherType} />

      {/* Demo controls (overlaid on top) */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 100,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h2>Weather Background Demo</h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Time (HH:MM):</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '5px',
              border: 'none',
              width: '100%',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Weather Type:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {weatherTypes.map((type) => (
              <button
                key={type}
                onClick={() => setWeatherType(type)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  background: weatherType === type ? '#4CAF50' : '#666',
                  color: 'white',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#aaa' }}>
          <p>✓ Time-based atmospheric changes (dawn/noon/sunset/night)</p>
          <p>✓ Animated clouds with parallax</p>
          <p>✓ Sun/moon and twinkling stars</p>
          <p>✓ Weather effects (rain/snow/fog)</p>
          <p>✓ Respects prefers-reduced-motion</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherBackgroundDemo;

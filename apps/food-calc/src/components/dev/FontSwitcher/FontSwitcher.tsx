import { useState, useEffect } from 'react';

const FONTS = [
  { name: 'Jost (current)', family: '"Jost", sans-serif' },
  { name: 'Raleway', family: '"Raleway", sans-serif' },
  { name: 'Merriweather', family: '"Merriweather", serif' },
  { name: 'Inter', family: '"Inter", sans-serif' },
  { name: 'Oswald', family: '"Oswald", sans-serif' },
  { name: 'Bebas Neue', family: '"Bebas Neue", sans-serif' },
  { name: 'Montserrat', family: '"Montserrat", sans-serif' },
  { name: 'Roboto Condensed', family: '"Roboto Condensed", sans-serif' },
  { name: 'Space Mono', family: '"Space Mono", monospace' },
  { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace' },
  { name: 'Fira Code', family: '"Fira Code", monospace' },
  { name: 'Playfair Display', family: '"Playfair Display", serif' },
  { name: 'Source Code Pro', family: '"Source Code Pro", monospace' },
];

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Montserrat:wght@400;700&family=Roboto+Condensed:wght@400;700&family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Fira+Code:wght@400;700&family=Playfair+Display:wght@400;700&family=Source+Code+Pro:wght@400;700&display=swap';

export const FontSwitcher = () => {
  const [index, setIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Load Google Fonts dynamically
    const existing = document.querySelector('[data-dev-fonts]');
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = GOOGLE_FONTS_URL;
      link.setAttribute('data-dev-fonts', 'true');
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--dev-symbol-font',
      FONTS[index].family
    );
  }, [index]);

  const prev = () => setIndex((i) => (i - 1 + FONTS.length) % FONTS.length);
  const next = () => setIndex((i) => (i + 1) % FONTS.length);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 99999,
          background: '#222',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 12,
          cursor: 'pointer',
          opacity: 0.7,
        }}
      >
        F
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 99999,
        background: '#222',
        color: '#fff',
        borderRadius: 10,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontFamily: 'sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        userSelect: 'none',
      }}
    >
      <button onClick={prev} style={btnStyle}>
        ←
      </button>
      <span
        style={{
          minWidth: 140,
          textAlign: 'center',
          fontFamily: FONTS[index].family,
          fontWeight: 700,
        }}
      >
        {FONTS[index].name}
      </span>
      <button onClick={next} style={btnStyle}>
        →
      </button>
      <span style={{ opacity: 0.5, fontSize: 11 }}>
        {index + 1}/{FONTS.length}
      </span>
      <button
        onClick={() => setCollapsed(true)}
        style={{ ...btnStyle, fontSize: 10 }}
      >
        ✕
      </button>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 4,
  padding: '2px 8px',
  cursor: 'pointer',
  fontSize: 14,
};

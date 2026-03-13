import { useState, useEffect } from 'react';

// Only fonts with confirmed Cyrillic support
const FONTS = [
  { name: 'Jost (current)', family: '"Jost", sans-serif' },
  // — elegant serif with Cyrillic —
  { name: 'Cormorant Garamond', family: '"Cormorant Garamond", serif' },
  { name: 'Cormorant Infant', family: '"Cormorant Infant", serif' },
  { name: 'Cormorant SC', family: '"Cormorant SC", serif' },
  { name: 'Playfair Display', family: '"Playfair Display", serif' },
  { name: 'Lora', family: '"Lora", serif' },
  { name: 'EB Garamond', family: '"EB Garamond", serif' },
  { name: 'Spectral', family: '"Spectral", serif' },
  { name: 'Merriweather', family: '"Merriweather", serif' },
  { name: 'Source Serif 4', family: '"Source Serif 4", serif' },
  { name: 'PT Serif', family: '"PT Serif", serif' },
  { name: 'Alegreya', family: '"Alegreya", serif' },
  { name: 'Yeseva One', family: '"Yeseva One", display' },
  { name: 'Literata', family: '"Literata", serif' },
  // — elegant sans-serif with Cyrillic —
  { name: 'Tenor Sans', family: '"Tenor Sans", sans-serif' },
  { name: 'Raleway', family: '"Raleway", sans-serif' },
  { name: 'Oswald', family: '"Oswald", sans-serif' },
  { name: 'Montserrat', family: '"Montserrat", sans-serif' },
  { name: 'PT Sans', family: '"PT Sans", sans-serif' },
  { name: 'Nunito', family: '"Nunito", sans-serif' },
  { name: 'Exo 2', family: '"Exo 2", sans-serif' },
];

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Cormorant+Infant:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Cormorant+SC:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Lora:ital,wght@0,400;0,700;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&family=Spectral:ital,wght@0,200;0,300;0,400;0,700;1,200;1,300;1,400;1,700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,200;0,8..60,300;0,8..60,400;0,8..60,700;1,8..60,200;1,8..60,300;1,8..60,400;1,8..60,700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Alegreya:ital,wght@0,400;0,700;1,400;1,700&family=Yeseva+One&family=Literata:ital,opsz,wght@0,7..72,200;0,7..72,300;0,7..72,400;0,7..72,700;1,7..72,200;1,7..72,300;1,7..72,400;1,7..72,700&family=Tenor+Sans&family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,700;1,100;1,200;1,300;1,400;1,700&family=Oswald:wght@200;300;400;700&family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,700;1,100;1,200;1,300;1,400;1,700&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Nunito:ital,wght@0,200;0,300;0,400;0,700;1,200;1,300;1,400;1,700&family=Exo+2:ital,wght@0,100;0,200;0,300;0,400;0,700;1,100;1,200;1,300;1,400;1,700&display=swap&subset=cyrillic';

type Target = 'title' | 'date-num' | 'date-word';

const TARGETS: { id: Target; label: string }[] = [
  { id: 'title', label: 'title' },
  { id: 'date-num', label: 'num' },
  { id: 'date-word', label: 'word' },
];

const CSS_VARS: Record<Target, { font: string; weight: string; style: string }> = {
  'title':     { font: '--dev-symbol-font',    weight: '--dev-symbol-weight',    style: '--dev-symbol-style' },
  'date-num':  { font: '--dev-date-num-font',  weight: '--dev-date-num-weight',  style: '--dev-date-num-style' },
  'date-word': { font: '--dev-date-word-font', weight: '--dev-date-word-weight', style: '--dev-date-word-style' },
};

type TargetState = { fontIndex: number; weightIndex: number; italic: boolean };
const defaultState = (): TargetState => ({ fontIndex: 0, weightIndex: 1, italic: false });

export const FontSwitcher = () => {
  const [activeTarget, setActiveTarget] = useState<Target>('title');
  const [states, setStates] = useState<Record<Target, TargetState>>({
    'title':     defaultState(),
    'date-num':  defaultState(),
    'date-word': defaultState(),
  });
  const [collapsed, setCollapsed] = useState(false);

  const s = states[activeTarget];

  useEffect(() => {
    const existing = document.querySelector('[data-dev-fonts]');
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = GOOGLE_FONTS_URL;
      link.setAttribute('data-dev-fonts', 'true');
      document.head.appendChild(link);
    }
  }, []);

  // Sync all targets to CSS vars on any state change
  useEffect(() => {
    for (const target of TARGETS) {
      const st = states[target.id];
      const vars = CSS_VARS[target.id];
      document.documentElement.style.setProperty(vars.font, FONTS[st.fontIndex].family);
      document.documentElement.style.setProperty(vars.weight, String(WEIGHTS[st.weightIndex]));
      document.documentElement.style.setProperty(vars.style, st.italic ? 'italic' : 'normal');
    }
  }, [states]);

  const update = (patch: Partial<TargetState>) =>
    setStates((prev) => ({ ...prev, [activeTarget]: { ...prev[activeTarget], ...patch } }));

  const prevFont = () => update({ fontIndex: (s.fontIndex - 1 + FONTS.length) % FONTS.length });
  const nextFont = () => update({ fontIndex: (s.fontIndex + 1) % FONTS.length });
  const prevWeight = () => update({ weightIndex: (s.weightIndex - 1 + WEIGHTS.length) % WEIGHTS.length });
  const nextWeight = () => update({ weightIndex: (s.weightIndex + 1) % WEIGHTS.length });

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
        flexDirection: 'column',
        gap: 6,
        fontSize: 13,
        fontFamily: 'sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        userSelect: 'none',
        width: 280,
      }}
    >
      {/* Target tabs */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {TARGETS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTarget(t.id)}
            style={{
              ...btnStyle,
              flex: 1,
              background: activeTarget === t.id ? 'rgba(255,255,255,0.2)' : 'transparent',
              fontWeight: activeTarget === t.id ? 700 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
        <button onClick={() => setCollapsed(true)} style={{ ...btnStyle, fontSize: 10, marginLeft: 'auto' }}>✕</button>
      </div>

      {/* Font row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={prevFont} style={btnStyle}>←</button>
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: FONTS[s.fontIndex].family,
            fontWeight: WEIGHTS[s.weightIndex],
            fontStyle: s.italic ? 'italic' : 'normal',
            fontSize: 15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {FONTS[s.fontIndex].name}
        </span>
        <button onClick={nextFont} style={btnStyle}>→</button>
        <span style={{ opacity: 0.5, fontSize: 11, minWidth: 28, textAlign: 'right' }}>
          {s.fontIndex + 1}/{FONTS.length}
        </span>
      </div>

      {/* Weight row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={prevWeight} style={btnStyle}>←</button>
        <span style={{ flex: 1, textAlign: 'center', opacity: 0.8, fontSize: 12 }}>
          weight {WEIGHTS[s.weightIndex]}
        </span>
        <button onClick={nextWeight} style={btnStyle}>→</button>
      </div>

      {/* Style row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => update({ italic: false })}
          style={{ ...btnStyle, flex: 1, opacity: s.italic ? 0.4 : 1 }}
        >
          normal
        </button>
        <button
          onClick={() => update({ italic: true })}
          style={{ ...btnStyle, flex: 1, fontStyle: 'italic', opacity: s.italic ? 1 : 0.4 }}
        >
          italic
        </button>
      </div>
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
  fontSize: 13,
};

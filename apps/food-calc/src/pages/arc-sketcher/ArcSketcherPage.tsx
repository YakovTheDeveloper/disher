import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Screen } from '@/shared/ui/Screen';

type Point = { x: number; y: number };

const ANCHOR_RADIUS = 14;
const HIT_RADIUS = 28;

const ArcSketcherPage = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);
  const draggingRef = useRef<'A' | 'B' | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [a, setA] = useState<Point>({ x: 80, y: 120 });
  const [b, setB] = useState<Point>({ x: 280, y: 480 });
  const [pointCount, setPointCount] = useState(0);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (size.w > 0 && size.h > 0) {
      setA((prev) => (prev.x === 80 && prev.y === 120 ? { x: size.w * 0.18, y: size.h * 0.22 } : prev));
      setB((prev) => (prev.x === 280 && prev.y === 480 ? { x: size.w * 0.82, y: size.h * 0.78 } : prev));
    }
  }, [size.w, size.h]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pts = pointsRef.current;
    if (pts.length > 0) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = 'rgba(0,128,255,0.9)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    for (const [label, p] of [['A', a], ['B', b]] as const) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, ANCHOR_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = label === 'A' ? 'rgba(255,0,128,0.95)' : 'rgba(0,180,90,0.95)';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, p.x, p.y);
      ctx.fillStyle = '#000';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`(${Math.round(p.x)}, ${Math.round(p.y)})`, p.x + ANCHOR_RADIUS + 6, p.y + 4);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    redraw();
  }, [size.w, size.h]);

  useEffect(() => {
    redraw();
  });

  const localPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const dist2 = (p: Point, q: Point) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = localPoint(e);
    const r2 = HIT_RADIUS * HIT_RADIUS;
    if (dist2(p, a) <= r2) {
      draggingRef.current = 'A';
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      return;
    }
    if (dist2(p, b) <= r2) {
      draggingRef.current = 'B';
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      return;
    }
    drawingRef.current = true;
    pointsRef.current = [p];
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    setPointCount(1);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = localPoint(e);
    if (draggingRef.current === 'A') {
      setA(p);
      return;
    }
    if (draggingRef.current === 'B') {
      setB(p);
      return;
    }
    if (!drawingRef.current) return;
    pointsRef.current.push(p);
    setPointCount(pointsRef.current.length);
  };

  const handlePointerUp = () => {
    if (draggingRef.current) {
      draggingRef.current = null;
      return;
    }
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const payload = {
      a,
      b,
      points: pointsRef.current,
      viewport: { w: size.w, h: size.h },
    };
    (window as unknown as { __arcDraw: unknown }).__arcDraw = payload;
    localStorage.setItem('arcDraw', JSON.stringify(payload));
    console.log('[ArcSketcher] payload:', payload);
  };

  const clear = () => {
    pointsRef.current = [];
    setPointCount(0);
    redraw();
  };

  const copyToClipboard = () => {
    const payload = {
      a,
      b,
      points: pointsRef.current,
      viewport: { w: size.w, h: size.h },
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  return (
    <Screen>
      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '100dvh',
          background: '#fafafa',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            padding: 10,
            borderRadius: 10,
            background: 'rgba(0,0,0,0.78)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 12,
            zIndex: 2,
          }}
        >
          <span>точек: {pointCount}</span>
          <span>
            A: ({Math.round(a.x)}, {Math.round(a.y)})
          </span>
          <span>
            B: ({Math.round(b.x)}, {Math.round(b.y)})
          </span>
          <span style={{ flex: 1 }} />
          <button type="button" onClick={clear} style={{ padding: '4px 10px', cursor: 'pointer' }}>
            Очистить
          </button>
          <button
            type="button"
            onClick={copyToClipboard}
            style={{ padding: '4px 10px', cursor: 'pointer' }}
          >
            Скопировать JSON
          </button>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            padding: 10,
            borderRadius: 10,
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 11,
            lineHeight: 1.5,
            zIndex: 2,
          }}
        >
          Тяни <b>A</b> (розовая) и <b>B</b> (зелёная) куда нужно. На пустом месте — рисуй кривую от A к B. После «Скопировать JSON» — пришли мне.
        </div>
      </div>
    </Screen>
  );
};

export default ArcSketcherPage;

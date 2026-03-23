/**
 * BodyAtomInput - Full-screen body pin picker for exact pain/discomfort location.
 *
 * User taps on a body silhouette to place pins at exact locations.
 * Supports front/back views. Pins are stored as normalized coordinates.
 */

import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BodyAtom, BodyPoint } from '@/entities/schedule-event';
import { PresetChips } from './shared';
import styles from './BodyAtomInput.module.css';

export interface BodyAtomInputProps {
  onAddAtom: (atom: BodyAtom) => void;
  onClose: () => void;
  accentColor?: string;
}

const PRESET_LABELS = ['боль', 'дискомфорт', 'напряжение', 'онемение', 'слабость'];

/** SVG viewBox dimensions — all coordinates normalized to this */
const VB_W = 200;
const VB_H = 500;

/**
 * Minimal human body silhouette path (front view).
 * Designed to be recognizable and lightweight.
 */
const BODY_FRONT_PATH = `
  M100,18 C112,18 120,28 120,40 C120,52 112,62 100,62 C88,62 80,52 80,40 C80,28 88,18 100,18 Z
  M100,65 L100,68
  M72,80 L58,130 L52,165 L60,167 L72,135 L80,105
  M128,80 L142,130 L148,165 L140,167 L128,135 L120,105
  M80,72 C80,72 76,75 72,80
  M120,72 C120,72 124,75 128,80
  M80,72 L82,68 C85,65 95,64 100,64 C105,64 115,65 118,68 L120,72
  L120,105 C120,108 118,160 118,200
  L122,280 L126,350 L124,400 L118,440 L110,450 L102,452 L100,450
  L98,452 L90,450 L82,440 L76,400 L74,350 L78,280
  L82,200 C82,160 80,108 80,105 Z
`;

const BODY_BACK_PATH = `
  M100,18 C112,18 120,28 120,40 C120,52 112,62 100,62 C88,62 80,52 80,40 C80,28 88,18 100,18 Z
  M100,65 L100,68
  M72,80 L56,135 L50,168 L58,170 L72,138 L80,105
  M128,80 L144,135 L150,168 L142,170 L128,138 L120,105
  M80,72 C80,72 76,75 72,80
  M120,72 C120,72 124,75 128,80
  M80,72 L82,68 C85,65 95,64 100,64 C105,64 115,65 118,68 L120,72
  L120,105 C120,108 118,160 118,200
  L122,280 L126,350 L124,400 L118,440 L110,450 L102,452 L100,450
  L98,452 L90,450 L82,440 L76,400 L74,350 L78,280
  L82,200 C82,160 80,108 80,105 Z
  M85,80 L85,160 M115,80 L115,160
`;

export function formatBodyPoints(points: BodyPoint[]): string {
  const frontCount = points.filter((p) => p.side === 'front').length;
  const backCount = points.filter((p) => p.side === 'back').length;
  const parts: string[] = [];
  if (frontCount > 0) parts.push(`${frontCount} спереди`);
  if (backCount > 0) parts.push(`${backCount} сзади`);
  return parts.join(', ');
}

export const BodyAtomInput = ({ onAddAtom, onClose }: BodyAtomInputProps) => {
  const [points, setPoints] = useState<BodyPoint[]>([]);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [label, setLabel] = useState('');
  const [showFullscreen, setShowFullscreen] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Convert screen coords to SVG viewBox coords, then normalize to 0-1
      const x = ((clientX - rect.left) / rect.width) * VB_W;
      const y = ((clientY - rect.top) / rect.height) * VB_H;

      const newPoint: BodyPoint = {
        x: Math.round((x / VB_W) * 1000) / 1000,
        y: Math.round((y / VB_H) * 1000) / 1000,
        side,
      };

      setPoints((prev) => [...prev, newPoint]);
    },
    [side]
  );

  const handleRemovePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirm = () => {
    setShowFullscreen(false);
  };

  const handleAdd = () => {
    if (points.length === 0) return;
    onAddAtom({
      kind: 'body',
      points,
      label: label || undefined,
    });
  };

  const currentSidePoints = points
    .map((p, i) => ({ ...p, originalIndex: i }))
    .filter((p) => p.side === side);

  const fullscreenContent = (
    <AnimatePresence>
      {showFullscreen && (
        <motion.div
          className={styles.fullscreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.header}>
            <button type="button" className={styles.closeBtn} onClick={onClose}>
              &times;
            </button>
            <span className={styles.headerTitle}>Укажите место</span>
            <button
              type="button"
              className={styles.doneBtn}
              onClick={handleConfirm}
              disabled={points.length === 0}
            >
              Готово ({points.length})
            </button>
          </div>

          <div className={styles.sideToggle}>
            <button
              type="button"
              className={side === 'front' ? styles.activeSide : ''}
              onClick={() => setSide('front')}
            >
              Спереди
            </button>
            <button
              type="button"
              className={side === 'back' ? styles.activeSide : ''}
              onClick={() => setSide('back')}
            >
              Сзади
            </button>
          </div>

          <div className={styles.bodyArea}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className={styles.bodySvg}
              onClick={handleSvgClick}
            >
              <path
                d={side === 'front' ? BODY_FRONT_PATH : BODY_BACK_PATH}
                fill="#e8e8e8"
                stroke="#ccc"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {currentSidePoints.map((point) => (
                <g key={point.originalIndex}>
                  <circle
                    cx={point.x * VB_W}
                    cy={point.y * VB_H}
                    r="10"
                    fill="rgba(239, 83, 80, 0.3)"
                  />
                  <circle
                    cx={point.x * VB_W}
                    cy={point.y * VB_H}
                    r="5"
                    fill="#ef5350"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={point.x * VB_W}
                    cy={point.y * VB_H}
                    r="12"
                    fill="transparent"
                    className={styles.pinHitArea}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePoint(point.originalIndex);
                    }}
                  />
                </g>
              ))}
            </svg>
          </div>

          <div className={styles.hint}>
            Нажмите на тело, чтобы поставить точку. Нажмите на точку, чтобы убрать.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // After fullscreen is closed, show label input + confirm
  if (!showFullscreen && points.length > 0) {
    return (
      <motion.div
        className={styles.labelPanel}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.pointsSummary}>
          {formatBodyPoints(points)} — {points.length} точ.
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => setShowFullscreen(true)}
          >
            Изменить
          </button>
        </div>

        <div>
          <label>Ощущение (опционально)</label>
          <input
            type="text"
            placeholder="боль, дискомфорт, напряжение..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <PresetChips presets={PRESET_LABELS} value={label} onChange={setLabel} />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Отмена
          </button>
          <button type="button" className={styles.addBtn} onClick={handleAdd}>
            Добавить
          </button>
        </div>
      </motion.div>
    );
  }

  return createPortal(fullscreenContent, document.body);
};

BodyAtomInput.displayName = 'BodyAtomInput';

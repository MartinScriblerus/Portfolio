import React, { useMemo, useEffect, useState } from 'react';
import { LAYOUTS } from '../constants';

type HexKeyboardProps = {
  // Overlay size; if omitted, it will stretch to full parent via CSS
  width?: number;
  height?: number;
  // Visuals
  tileRadius?: number; // pixel radius of each hexagon
  numNotes?: number;   // total tiles to render (approx)
  // Theory
  stepsPerOctave: number; // N in N-TET
  presetName: 'Wicki-Hayden' | 'Harmonic Table' | 'Janko' | 'Tonnetz (P5 vs M3)' | 'Tonnetz (P5 vs m3)';
  useSharps?: boolean;
  showFraction?: boolean;
  // Interactivity
  interactive?: boolean; // if true, overlay captures pointer events
  onTileClick?: (tile: { q: number; r: number; absStep: number; pitchIndex: number }) => void;
  // Customization hooks (optional)
  resolveLabel?: (absStep: number, pitchIndex: number, octave: number) => { main: string; sub?: string } | undefined;
  resolveFill?: (absStep: number, pitchIndex: number) => string | undefined;
  // Edge padding multiplier (in units of tileRadius) to control how close tiles get to the SVG edge
  paddingR?: number;
};

// Axial neighbors for pointy-top hexes
const AXIAL_NEIGHBORS: Array<[number, number]> = [
  [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];

function polygonPoints(cx: number, cy: number, r: number): string {
  // Pointy-top: angles start at 30deg, then every 60deg
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((Math.PI / 180) * (60 * i + 30));
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push([x, y]);
  }
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

// Convert axial (q, r) to pixel coords for pointy-top layout
function axialToPixel(q: number, r: number, radius: number) {
  const x = radius * Math.sqrt(3) * (q + r / 2);
  const y = radius * 1.5 * r;
  return { x, y };
}

// Interval basis for different isomorphic/tonnetz layouts (12-TET defaults)
function layoutBasis(preset: HexKeyboardProps['presetName'], stepsPerOctave: number) {
  // Prefer mapping from constants so all provided layouts are achievable
  const found = LAYOUTS.find(l => l.name === preset);
  const round = (x: number) => Math.round(x);
  if (found) {
    const i1 = found.vector1.interval; // in 12-TET steps
    const i2 = found.vector2.interval;
    const vQ = stepsPerOctave === 12 ? i1 : round(stepsPerOctave * (i1 / 12));
    const vR = stepsPerOctave === 12 ? i2 : round(stepsPerOctave * (i2 / 12));
    return { vQ, vR };
  }
  // Fallback sensible mapping if not found
  const fifth = stepsPerOctave === 12 ? 7 : round(stepsPerOctave * (7 / 12));
  const M2 = stepsPerOctave === 12 ? 2 : round(stepsPerOctave * (2 / 12));
  return { vQ: fifth, vR: M2 };
}

function noteName12(pc: number, sharps = true) {
  const pc12 = ((pc % 12) + 12) % 12;
  const NAMES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const NAMES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  return (sharps ? NAMES_SHARP : NAMES_FLAT)[pc12];
}

function HexKeyboard({
  width,
  height,
  tileRadius = 26,
  numNotes = 57,
  stepsPerOctave,
  presetName,
  useSharps = true,
  showFraction = false,
  interactive = false,
  onTileClick,
  resolveLabel,
  resolveFill,
  paddingR = 0.5,
}: HexKeyboardProps) {
  const colors = ['#ff5555','#55ff55','#5555ff','#ffaa00','#aa00ff','#00aaff'];
  const [, forceUpdate] = useState(0);

  // Subscribe to pressed keys updates for visual feedback
  useEffect(() => {
    const manager = (window as any).__keyboardHIDManager;
    if (manager) {
      const updatePressedKeys = () => {
        forceUpdate(prev => prev + 1);
      };
      manager.onPressedKeysChange(updatePressedKeys);
      return () => {
        // Cleanup if needed
      };
    }
  }, []);

  const tiles = useMemo(() => {
    // BFS from center to gather approximately numNotes axial coordinates
    const seen = new Set<string>();
    const out: Array<{ q: number; r: number }> = [];
    const queue: Array<{ q: number; r: number }> = [{ q: 0, r: 0 }];
    const key = (q: number, r: number) => `${q},${r}`;
    seen.add(key(0, 0));
    let qi = 0;
    while (qi < queue.length && out.length < (numNotes || 0)) {
      const cur = queue[qi++];
      out.push(cur);
      for (const [dq, dr] of AXIAL_NEIGHBORS) {
        const nq = cur.q + dq;
        const nr = cur.r + dr;
        const k = key(nq, nr);
        if (!seen.has(k)) {
          seen.add(k);
          queue.push({ q: nq, r: nr });
        }
      }
    }
    return out;
  }, [numNotes]);

  const { vQ, vR } = useMemo(() => layoutBasis(presetName, stepsPerOctave), [presetName, stepsPerOctave]);

  const tilesWithGeom = useMemo(() => {
    return tiles.map(({ q, r }) => {
      const { x, y } = axialToPixel(q, r, tileRadius);
      const absStep = q * vQ + r * vR; // isomorphic mapping from axial basis
      const pitchIndex = ((absStep % stepsPerOctave) + stepsPerOctave) % stepsPerOctave;
      const octave = Math.floor(absStep / stepsPerOctave);
      return { q, r, x, y, absStep, pitchIndex, octave };
    });
  }, [tiles, tileRadius, vQ, vR, stepsPerOctave]);

  // Compute bounds for auto-centering
  const bounds = useMemo(() => {
    if (!tilesWithGeom.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const t of tilesWithGeom) {
      if (t.x < minX) minX = t.x;
      if (t.x > maxX) maxX = t.x;
      if (t.y < minY) minY = t.y;
      if (t.y > maxY) maxY = t.y;
    }
    return { minX, maxX, minY, maxY };
  }, [tilesWithGeom]);

  const cx = width ? width / 2 : 0;
  const cy = height ? height / 2 : 0;

  const containerStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: interactive ? 'auto' as const : 'none' as const,
    zIndex: 5,
  };

  const svgProps = {
    width: width ?? '100%',
    height: height ?? '100%',
    viewBox: `${bounds.minX - tileRadius * paddingR} ${bounds.minY - tileRadius * paddingR} ${(bounds.maxX - bounds.minX) + tileRadius * paddingR * 2} ${(bounds.maxY - bounds.minY) + tileRadius * paddingR * 2}`,
  } as const;

  return (
    <div style={containerStyles}>
      <svg {...svgProps}>
        {tilesWithGeom.map((t, i) => {
          const customFill = typeof resolveFill === 'function' ? resolveFill(t.absStep, t.pitchIndex) : undefined;
          const baseFill = customFill ?? colors[t.pitchIndex % colors.length];
          // Check if this key is pressed (for visual feedback)
          const manager = (window as any).__keyboardHIDManager;
          const pressedKeys = manager?.getPressedKeys() || new Set();
          // Calculate MIDI note for this tile (approximate)
          const midiNote = 60 + t.absStep; // C4 base
          const isPressed = pressedKeys.has(midiNote);
          const fill = isPressed 
            ? `var(--color-subdominant-primary, #00D9FF)` 
            : baseFill;
          const opacity = isPressed ? 1 : 0.5;
          const strokeWidth = isPressed ? 2.4 : 1.2;
          const pts = polygonPoints(t.x, t.y, tileRadius);
          let main = '';
          let sub: string | undefined = undefined;
          const resolved = typeof resolveLabel === 'function' ? resolveLabel(t.absStep, t.pitchIndex, t.octave) : undefined;
          if (resolved) {
            main = resolved.main;
            sub = resolved.sub;
          } else {
            if (stepsPerOctave === 12) {
              const midi = 60 + t.absStep; // C4 base
              const octave = Math.floor(midi / 12) - 1;
              main = `${noteName12(midi, useSharps)}${octave}`;
              if (showFraction) sub = `${((t.absStep % 12) + 12) % 12}/12`;
            } else {
              const k = ((t.absStep % stepsPerOctave) + stepsPerOctave) % stepsPerOctave;
              main = `${k}`;
              if (showFraction) sub = `${k}/${stepsPerOctave}`;
            }
          }
          const groupStyle: React.CSSProperties = interactive ? { cursor: onTileClick ? 'pointer' : 'default' } : {};
          return (
            <g key={`${t.q},${t.r}`} style={groupStyle} onClick={onTileClick ? () => onTileClick({ q: t.q, r: t.r, absStep: t.absStep, pitchIndex: t.pitchIndex }) : undefined}>
              <polygon points={pts} fill={fill} opacity={opacity} stroke={fill} strokeWidth={strokeWidth} />
              <text x={t.x} y={t.y} textAnchor="middle" dominantBaseline="middle" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" fontSize={tileRadius * 0.6} fill="#ffffff" style={{ userSelect: 'none' }}>{main}</text>
              {sub && (
                <text x={t.x} y={t.y + tileRadius * 0.45} textAnchor="middle" dominantBaseline="hanging" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" fontSize={tileRadius * 0.35} fill="#e8e8e8" style={{ userSelect: 'none' }}>{sub}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default React.memo(HexKeyboard);

'use client';
import React, { useMemo, useRef, useState } from 'react';

type Props = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  size?: number; // px
  color?: string; // arc color
};

export default function Knob2D({
  label, min, max, step = 0.01, value, onChange, size = 88, color = '#78a6ff'
}: Props) {
  const r = Math.round(size / 2);
  const stroke = 8;
  const radius = r - stroke - 2;
  const circumference = 2 * Math.PI * radius;

  const pct = (value - min) / (max - min || 1);
  const angle = -135 + 270 * Math.max(0, Math.min(1, pct));
  const arcLen = circumference * Math.max(0, Math.min(1, pct));
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ y: number; v: number } | null>(null);

  function setClamped(next: number) {
    const clamped = Math.min(max, Math.max(min, step ? Math.round(next / step) * step : next));
    onChange(clamped);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    startRef.current = { y: e.clientY, v: value };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !startRef.current) return;
    const dy = startRef.current.y - e.clientY; // drag up to increase
    const span = max - min;
    const sensitivity = 0.003; // tune
    setClamped(startRef.current.v + dy * span * sensitivity);
  }
  function onPointerUp() {
    setDragging(false);
    startRef.current = null;
  }

  const display = useMemo(() => {
    const s = step.toString();
    const decimals = s.includes('.') ? (s.split('.')[1]?.length || 0) : 0;
    return value.toFixed(decimals || 2);
  }, [value, step]);

  return (
    <div style={{ width: size, userSelect: 'none', pointerEvents: 'auto', textAlign: 'center' }}>
      <svg
        width={size} height={size}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          display: 'block',
          cursor: 'ns-resize',
          borderRadius: 12,
          background: 'linear-gradient(180deg, rgba(28,30,38,.72), rgba(18,19,24,.72))',
          boxShadow: dragging ? '0 0 0 2px rgba(120,166,255,.5) inset, 0 2px 12px rgba(0,0,0,.6)' : '0 1px 10px rgba(0,0,0,.55)',
        }}
      >
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9e9ee" />
            <stop offset="100%" stopColor="#a5adba" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={r} cy={r} r={radius} stroke="rgba(255,255,255,.12)" strokeWidth={stroke} fill="none" />
        {/* Arc */}
        <circle
          cx={r} cy={r} r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${arcLen} ${circumference - arcLen}`}
          strokeDashoffset={circumference * 0.375} // start at -135 deg
          strokeLinecap="round"
          style={{ transition: dragging ? 'none' : 'stroke-dasharray .12s ease-out' }}
        />
        {/* Pointer */}
        <g transform={`translate(${r},${r}) rotate(${angle})`}>
          <rect x={-1} y={-(radius - 4)} width={2} height={radius - 10} fill="url(#g1)" rx={1} />
        </g>
      </svg>
      <div style={{ marginTop: 6, fontSize: 12, color: '#e8e8e8' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#9ad' }}>{display}</div>
    </div>
  );
}
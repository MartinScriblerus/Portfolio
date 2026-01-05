// src/components/WaveformCanvas.tsx
'use client';

import React, { useRef, useEffect } from 'react';

type Props = {
  getSamples: () => Float32Array | null; // latest time-domain snapshot
  height?: number;
  color?: string;
  bg?: string;
  lineWidth?: number;
};

export function WaveformCanvas({
  getSamples,
  height = 80,
  color = '#00e0ff',
  bg = 'transparent',
  lineWidth = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let running = true;

    // Throttle to 30 FPS to avoid competing with Babylon render loop
    // 1000ms / 30fps = ~33.33ms per frame
    const TARGET_FPS = 30;
    const MIN_FRAME_MS = 1000 / TARGET_FPS;

    const loop = () => {
      if (!running) return;

      const now = performance.now();
      const elapsed = now - lastUpdateRef.current;

      // Skip frame if not enough time has passed (throttle to 30 FPS)
      if (elapsed < MIN_FRAME_MS) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      lastUpdateRef.current = now;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const cssW = canvas.clientWidth || 600;
      const cssH = height;
      const width = Math.floor(cssW * dpr);
      const heightPx = Math.floor(cssH * dpr);
      if (canvas.width !== width || canvas.height !== heightPx) {
        canvas.width = width;
        canvas.height = heightPx;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // clear
      ctx.clearRect(0, 0, cssW, cssH);
      if (bg !== 'transparent') {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cssW, cssH);
      }

      const data = getSamples();
      if (data && data.length > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        const len = data.length;
        for (let x = 0; x < cssW; x++) {
          const idx = Math.floor((x / cssW) * len);
          const v = data[idx]; // -1..1
          const y = (1 - (v + 1) / 2) * cssH;
          if (x === 0) ctx.moveTo(0, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Continue with RAF but throttled to avoid competing with Babylon
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [getSamples, height, color, bg, lineWidth]);

  return <canvas ref={canvasRef} style={{ width: '100%', height }} />;
}
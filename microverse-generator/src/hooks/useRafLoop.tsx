'use client';

import { useEffect, useRef } from 'react';

export function useRafLoop(callback?: (time: number, delta: number) => void) {
  const frame = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    function tick(time: number) {
      if (lastTime.current != null && callback) {
        callback(time, time - lastTime.current);
      }
      lastTime.current = time;
      frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);

    if (frame.current !== null) {
        console.log('RAF loop started with frame ID:', frame.current);
    }

    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [callback]);

  return frame;
}
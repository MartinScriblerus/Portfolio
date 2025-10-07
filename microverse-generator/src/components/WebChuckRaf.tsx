'use client';

import { useEffect } from 'react';
import { useRafLoop } from '../hooks/useRafLoop';
import { useTickStore } from '../store/useTickStore';

export default function WebChucKRaf() {
  const setTick = useTickStore((s) => s.setTick);

  useEffect(() => {
    // 🔹 Only import webchuck dynamically in the browser
    import('webchuck').then(({ Chuck }) => {
      const chuck = Chuck.init([]);
      console.log('WebChucK initialized:', chuck);
    }).catch(console.error);
  }, []);

  useRafLoop((time, delta) => {
    setTick(time, delta);
  });

  return null;
}
'use client';

import { useRafLoop } from '../hooks/useRafLoop';
import { useTickStore } from '../store/useTickStore';

export default function RafLoopClient() {
  const setTick = useTickStore((s) => s.setTick);

  // RAF loop updates global store
  useRafLoop((time, delta) => {
    setTick(time, delta);
    // client behavior linked to the tick can go here
  });

  return null;
}
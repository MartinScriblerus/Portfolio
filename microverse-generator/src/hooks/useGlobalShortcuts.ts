// src/hooks/useGlobalShortcuts.ts
'use client';

import { useEffect } from 'react';

type Handlers = Partial<{
  toggleGrid: () => void;   // 'g'
  toggleMixer: () => void;  // 'm'
  toggleFx: () => void;     // 'f'
  showHelp: () => void;     // '?'
  playPause: () => void;    // 'space'
  tapTempo: () => void;     // 't'
}>;

export function useGlobalShortcuts(handlers: Handlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'g' && handlers.toggleGrid) { e.preventDefault(); handlers.toggleGrid(); }
      else if (key === 'm' && handlers.toggleMixer) { e.preventDefault(); handlers.toggleMixer(); }
      else if (key === 'f' && handlers.toggleFx) { e.preventDefault(); handlers.toggleFx(); }
      else if (e.key === '?') { e.preventDefault(); handlers.showHelp?.(); }
      else if (e.code === 'Space') { e.preventDefault(); handlers.playPause?.(); }
      else if (key === 't') { handlers.tapTempo?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
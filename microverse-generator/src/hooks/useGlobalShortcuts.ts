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
      // Don't intercept if user is typing in an input/textarea/select
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      
      // Don't intercept if HID keyboard manager is active (let it handle musical keys)
      const hidManager = (window as any).__keyboardHIDManager;
      if (hidManager && hidManager.isEnabled && !hidManager.inputFocused) {
        // Only intercept non-musical keys (g, m, f, t, ?, space)
        const key = e.key.toLowerCase();
        const isMusicalKey = ['q','w','e','r','t','y','u','i','o','p','z','x','c','v','b','n','m','2','3','4','5','6','7','8','9'].includes(key);
        if (isMusicalKey) {
          return; // Let HID manager handle it
        }
      }
      
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
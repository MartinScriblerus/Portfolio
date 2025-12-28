'use client';

import { ReactNode, useEffect } from 'react';
import WebChucKClient from '../src/components/WebChuckClient';

export default function ClientRoot({ children }: { children: ReactNode }) {
  // Prevent mouse wheel from changing focused numeric inputs globally.
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return;
        // If focused element is an <input type="number">, stop wheel from changing it
        if (active.tagName.toLowerCase() === 'input') {
          const inp = active as HTMLInputElement;
          if (inp.type === 'number') {
            e.preventDefault();
          }
        }
        // Also guard if an input child inside a MUI wrapper is focused
        const maybeInput = active.querySelector && active.querySelector('input[type="number"]');
        if (maybeInput) {
          e.preventDefault();
        }
      } catch (err) {
        // swallow
      }
    };
    window.addEventListener('wheel', handler, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', handler, { passive: false, capture: true } as any);
  }, []);

  return (
    <>
      <WebChucKClient /> {/* Top-level WebChucK */}
      {children}
    </>
  );
}
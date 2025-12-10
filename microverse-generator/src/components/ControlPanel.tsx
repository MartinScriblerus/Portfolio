import React, { useState } from "react";
import HydraControlsPopup from './HydraControlsPopup';
import { useVisStore } from '../store/useVisStore';
import { useOldMonolithStore } from '../store/useOldMonolithStore';

export default function ControlPanel() {
  const [hydraControlsOpen, setHydraControlsOpen] = useState(false);
  const rightDrawerOpen = useOldMonolithStore((s) => s.rightDrawerOpen);
  const setRightDrawerOpen = useOldMonolithStore((s) => s.setRightDrawerOpen);

  const buttonStyle = {
    background: 'var(--color-dominant-surface, #1A1C20)',
    color: 'var(--color-dominant-text, #fff)',
    border: '2px solid var(--color-subdominant-primary, #00D9FF)',
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.2s ease',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--color-subdominant-primary, #00D9FF)';
    e.currentTarget.style.color = 'var(--color-subdominant-text, #0A0B0D)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--color-dominant-surface, #1A1C20)';
    e.currentTarget.style.color = 'var(--color-dominant-text, #fff)';
  };

  return (
    <div 
      style={{ 
        position:'absolute', 
        top: 8, 
        left: 8, /* Align with HID button and play button */
        zIndex: 10000, 
        background: 'transparent',
        color: 'var(--color-dominant-text, #eee)', 
        borderRadius: 6, 
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', 
        fontSize: 12,
        pointerEvents: 'auto'
    }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button
          onClick={() => setHydraControlsOpen(true)}
          aria-label="Open Hydra visual controls"
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Hydra Controls
        </button>
        <button
          onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
          aria-label={rightDrawerOpen ? "Close ChucK Controls" : "Open ChucK Controls"}
          aria-pressed={rightDrawerOpen}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          ChucK Controls
        </button>
      </div>
      <HydraControlsPopup open={hydraControlsOpen} onClose={() => setHydraControlsOpen(false)} />
    </div>
  );
}
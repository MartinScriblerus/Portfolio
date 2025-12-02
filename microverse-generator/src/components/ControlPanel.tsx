import React, { useState } from "react";
import HydraControlsPopup from './HydraControlsPopup';

export default function ControlPanel() {
  const [hydraControlsOpen, setHydraControlsOpen] = useState(false);

  return (
    <div 
      style={{ 
        position:'absolute', 
        top: 8, 
        left: 232, 
        zIndex: 10000, 
        background: 'rgba(0,0,0,0.6)', 
        color: '#eee', 
        padding: 8, 
        border:'1px solid #444', 
        borderRadius: 6, 
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', 
        fontSize: 12,
        pointerEvents: 'auto'
    }}>
      {/* Category and Layout dropdowns moved to MicrotonesSearch component - only shown in Hex mode */}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button
          onClick={() => setHydraControlsOpen(true)}
          style={{
            background:'#333',
            color:'#fff',
            border:'1px solid #555',
            padding:'6px 12px',
            borderRadius:4,
            cursor:'pointer',
            fontSize: 12,
          }}
        >
          Hydra Controls
        </button>
      </div>
      <HydraControlsPopup open={hydraControlsOpen} onClose={() => setHydraControlsOpen(false)} />
    </div>
  );
}
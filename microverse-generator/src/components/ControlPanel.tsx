import React, { useState } from "react";
import { useLayoutStore } from '../store/useLayoutStore';
import HydraControlsPopup from './HydraControlsPopup';

export default function ControlPanel() {
  const category = useLayoutStore(s => s.category);
  const layoutIndex = useLayoutStore(s => s.layoutIndex);
  const setCategory = useLayoutStore(s => s.setCategory);
  const setLayoutIndex = useLayoutStore(s => s.setLayoutIndex);
  const [hydraControlsOpen, setHydraControlsOpen] = useState(false);

  const categories: Array<{ value: 'isomorphic'|'tonnetz'; label: string }> = [
    { value: 'isomorphic', label: 'Isomorphic' },
    { value: 'tonnetz', label: 'Tonnetz' },
  ];
  // Use explicit two-string options per category (do not couple UI list to constants)
  const layoutOptionsByCategory: Record<'isomorphic'|'tonnetz', string[]> = {
    isomorphic: ['Wicki-Hayden', 'Harmonic Table'],
    tonnetz: ['Tonnetz (P5 vs M3)', 'Tonnetz (P5 vs m3)'],
  };
  const options = layoutOptionsByCategory[category] ?? [];

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
      <div style={{ marginBottom:6, display:'flex', gap:8, alignItems:'center' }}>
        <label style={{ opacity:0.8 }}>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          style={{ background:'#111', color:'#fff', border:'1px solid #555', padding:'4px 6px', borderRadius:4 }}
        >
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <label style={{ opacity:0.8 }}>Layout</label>
        <select
          value={layoutIndex}
          onChange={(e) => setLayoutIndex(parseInt(e.target.value, 10))}
          style={{ background:'#111', color:'#fff', border:'1px solid #555', padding:'4px 6px', borderRadius:4 }}
        >
          {options.map((name, i) => <option key={name} value={i}>{name}</option>)}
        </select>
      </div>
      <div style={{ marginTop: 8, display:'flex', gap:8, alignItems:'center' }}>
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
'use client';
import React, { useEffect, useMemo } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import Knob2D from '../components/controls/Knob2D';

type Props = {
  visibleFXKnobs: any[];          // from OldBabylonLayer
  fxKnobsCount: number;
  fxRadioValue: string;           // same routing key you use today
  handleUpdateSliderVal: (fxGroup: string, spec: any, value: number) => void;
};

export default function PedalboardOverlayFromOld({
  visibleFXKnobs, fxKnobsCount, fxRadioValue, handleUpdateSliderVal
}: Props) {
  // Normalize old entries to { id,label,min,max,value,step,spec }
  const defs = useMemo(() => {
    const out: Array<{ id: string; label: string; min: number; max: number; value: number; step: number; spec: any }> = [];
    const take = Math.min(fxKnobsCount ?? visibleFXKnobs.length, visibleFXKnobs.length);
    for (let i = 0; i < take; i++) {
      const entry = visibleFXKnobs[i];
      if (!entry) continue;
      const label = Array.isArray(entry[0]) ? (entry[0][0] ?? `Param${i}`) : (entry[0] ?? `Param${i}`);
      const spec = entry[1] ?? {};
      const min = Number.isFinite(spec.min) ? spec.min : 0;
      const max = Number.isFinite(spec.max) ? spec.max : 1;
      const value = Number.isFinite(spec.value) ? spec.value : min;
      // heuristic: integers when old screenInterface suggested it
      const step = spec.step ?? (spec.screenInterface?.includes('int') ? 1 : 0.01);
      out.push({ id: `fx.${label}`, label: String(label), min, max, value, step, spec });
    }
    return out;
  }, [visibleFXKnobs, fxKnobsCount]);

  return (
    <Box
      data-hud
      sx={{
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 26,
        background: 'rgba(10,10,18,0.55)',
        backdropFilter: 'blur(10px)',
        color: '#e8e8e8',
        borderRadius: 2,
        p: 1.5,
        pointerEvents: 'none', // only children receive events
        width: 360,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>Pedalboard</Typography>
      </Box>
      <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,.12)' }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 14, pointerEvents: 'auto' }}>
        {defs.map((d, idx) => (
          <Knob2D
            key={d.id}
            label={d.label}
            min={d.min}
            max={d.max}
            step={d.step}
            value={d.value}
            onChange={(v) => handleUpdateSliderVal(fxRadioValue, d.spec, v)}
          />
        ))}
      </Box>
    </Box>
  );
}
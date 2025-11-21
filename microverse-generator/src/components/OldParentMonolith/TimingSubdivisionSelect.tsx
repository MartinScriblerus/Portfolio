// src/components/OldParentMonolith/TimingSubdivisionSelect.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Switch, FormControlLabel } from '@mui/material';
import { Subdivision, intervalMs, logTimingInfo } from '../../utils/siteHelpers';

type Props = {
  bpm: number;
  beatsNumerator: number;
  beatsDenominator: number;
  onChange?: (sub: Subdivision) => void;
};

const BASE_OPTIONS: Subdivision[] = [
  { unit: '1/4' },
  { unit: '1/8' },
  { unit: '1/16' },
  { unit: '1/32' },
];

export function TimingSubdivisionSelect({ bpm, beatsNumerator, beatsDenominator, onChange }: Props) {
  const [sel, setSel] = useState<Subdivision>({ unit: '1/16' });
  const [dotted, setDotted] = useState(false);
  const [triplet, setTriplet] = useState(false);

  // keep them mutually exclusive for clarity (you can relax this if you want both)
  useEffect(() => {
    if (dotted && triplet) setTriplet(false);
  }, [dotted]);
  useEffect(() => {
    if (triplet && dotted) setDotted(false);
  }, [triplet]);

  const cur: Subdivision = useMemo(() => ({ unit: sel.unit, dotted, triplet }), [sel.unit, dotted, triplet]);

  useEffect(() => {
    logTimingInfo(bpm, cur, beatsNumerator, beatsDenominator);
    onChange?.(cur);
  }, [bpm, cur.unit, cur.dotted, cur.triplet, beatsNumerator, beatsDenominator]);

  const label = (s: Subdivision) => {
    let name = s.unit.replace('1/', '') + 'th';
    if (s.unit === '1/4') name = 'quarter';
    if (s.unit === '1/2') name = 'half';
    if (s.unit === '1/1') name = 'whole';
    return name;
  };

  const currentMs = intervalMs(bpm, cur);

  return (
    <Box sx={{ color: 'rgba(255,255,255,0.78)', display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: "100%", color: 'rgba(255,245,245,0.78)' }}>
        <InputLabel sx={{color: 'rgba(255,255,255,0.78)'}} id="subdiv-label">Subdivision</InputLabel>
        <Select
          labelId="subdiv-label"
          label="Subdivision"
          value={sel.unit}
          sx={{
            color: 'rgba(255,255,255,0.78)'
          }}
          onChange={(e: SelectChangeEvent) => setSel({ unit: e.target.value as any })}
        >
          {BASE_OPTIONS.map(opt => (
            <MenuItem 
              key={opt.unit} 
              value={opt.unit}
              sx={{
                color: "rbga(255,245,245,0.78)",
              }}
            >
              {label(opt)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControlLabel
          sx={{
            color: 'rgba(255,255,255,0.78)'
          }}
          control={<Switch size="small" checked={dotted} onChange={(_, v) => setDotted(v)} />}
          label="Dotted"
        />
        <FormControlLabel
          sx={{
            color: 'rgba(255,255,255,0.78)'
          }}
          control={<Switch size="small" checked={triplet} onChange={(_, v) => setTriplet(v)} />}
          label="Triplet"
        />
      </Box>

      <Box sx={{ color: 'rgba(255,255,255,0.78)',fontFamily: 'monospace', fontSize: 12 }}>
        {Math.round(currentMs)} ms
      </Box>
    </Box>
  );
}
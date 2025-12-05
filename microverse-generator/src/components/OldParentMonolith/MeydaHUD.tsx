"use client";
import React, { useMemo, useState } from 'react';
import { Box, LinearProgress, Typography, Button, Stack, Chip } from '@mui/material';
import useAudioAnalysisAndMIDI from './useAudioAnalysisAndMIDI';
import { chuckRef } from '../../../app/state/refs';
import { useClipAnalysisStore } from '../../store/useClipAnalysisStore';
import { useSignalBus } from '../../store/useSignalBus';

export default function MeydaHUD() {
  const { meydaData, midiData } = useAudioAnalysisAndMIDI(chuckRef as any, []);
  const [pinned, setPinned] = useState<any | null>(null);
  const byFile = useClipAnalysisStore(s => s.byFile);
  const lastKey = useClipAnalysisStore(s => s.lastKey);
  const savedCount = Object.keys(byFile).length;

  const rmsPct = useMemo(() => {
    const v = (meydaData?.rms as number) ?? 0;
    return Math.max(0, Math.min(1, v)) * 100;
  }, [meydaData?.rms]);

  const centroid = useMemo(() => {
    return Math.round(((meydaData?.spectralCentroid as number) ?? 0));
  }, [meydaData?.spectralCentroid]);

  const rolloff = useMemo(() => {
    return Math.round(((meydaData?.spectralRolloff as number) ?? 0));
  }, [meydaData?.spectralRolloff]);

  const zcr = useMemo(() => {
    const v = (meydaData?.zcr as number) ?? 0;
    return +(v).toFixed(3);
  }, [meydaData?.zcr]);

  const onsetPulse = useSignalBus(s => s.onsetPulse);
  const lastOnset = useSignalBus(s => s.lastOnsetTs);

  const mfcc = (meydaData?.mfcc as number[]) || [];
  const chroma = (meydaData?.chroma as number[]) || [];

  return (
    <Box sx={{
      position: 'absolute',
      left: 16,
      bottom: 16,
      minWidth: 260,
      background: 'rgba(255,255,255,0.078)',
      color: '#e8e8e8',
      borderRadius: 1.5,
      p: 1.5,
      pointerEvents: 'none',
      zIndex: 99999,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pointerEvents: 'auto' }}>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>Live Analysis</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" color="info" onClick={() => setPinned(meydaData)} disabled={!meydaData}>Pin</Button>
          <Button size="small" variant="outlined" color="inherit" onClick={() => setPinned(null)} disabled={!pinned}>Clear</Button>
        </Stack>
      </Box>
      {savedCount > 0 && (
        <Box sx={{ mt: 0.5, pointerEvents: 'auto' }}>
          <Chip size="small" label={`${savedCount} clip analyses saved${lastKey ? ` • last: ${lastKey}` : ''}`} variant="outlined" />
        </Box>
      )}
      <Box sx={{ mt: 0.75 }}>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>RMS</Typography>
        <LinearProgress variant="determinate" value={rmsPct} sx={{ height: 6, borderRadius: 1 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <Typography variant="caption">Centroid: {centroid} Hz</Typography>
        <Typography variant="caption">Rolloff: {rolloff} Hz</Typography>
        <Typography variant="caption">ZCR: {zcr}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <Typography variant="caption">Onset pulse: {(onsetPulse ?? 0).toFixed(2)}</Typography>
        <Typography variant="caption">
          Last onset: {lastOnset ? `${Math.max(0, Math.round(performance.now() - lastOnset))} ms ago` : '—'}
        </Typography>
      </Box>
      {mfcc.length > 0 && (
        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 0.5 }}>
          {mfcc.slice(0, 13).map((v, i) => (
            <Box key={i} sx={{ height: 18, background: 'rgba(77,145,255,0.35)' }} title={`MFCC${i+1}: ${v.toFixed(2)}`} />
          ))}
        </Box>
      )}
      {chroma.length > 0 && (
        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0.5 }}>
          {chroma.slice(0, 12).map((v, i) => (
            <Box key={i} sx={{ height: 8, background: 'rgba(0,200,255,0.35)', width: `${Math.min(1, Math.max(0, v)) * 100}%` }} />
          ))}
        </Box>
      )}
      {midiData && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>MIDI In</Typography>
        </Box>
      )}
      {pinned && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>Pinned snapshot</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            <Typography variant="caption">Centroid: {Math.round(pinned?.spectralCentroid ?? 0)} Hz</Typography>
            <Typography variant="caption">RMS: {(((pinned?.rms ?? 0) * 100) | 0)}%</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

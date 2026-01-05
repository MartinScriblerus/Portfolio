'use client';

import React from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useTransportStore } from '../store/useTransportStore';
import { useTimingStore } from '../hooks/useTimingStore';
import { useBeatGridStore } from '../store/useBeatGridStore';
import { chuckRef, filesToProcess, uploadedBlob } from '../../app/state/refs';

/**
 * Timing Controls: BPM, Time Signature, and Subdivision controls
 * Positioned in the right-side panel
 */
export default function TimingControls() {
  const bpm = useTransportStore(s => s.bpm);
  const timeSig = useTransportStore(s => s.timeSig);
  const setBpm = useTransportStore(s => s.setBpm);
  const setTimeSig = useTransportStore(s => s.setTimeSig);
  
  // Sync useTimingStore with useTransportStore
  const setTimingBpm = useTimingStore((s: any) => s.setBpm);
  const setTimingBeatMs = useTimingStore((s: any) => s.setBeatMs);
  
  React.useEffect(() => {
    setTimingBpm(bpm);
    setTimingBeatMs((60 / bpm) * 1000);
  }, [bpm, setTimingBpm, setTimingBeatMs]);

  // Sync time signature from transport store into the beat grid store
  const setBeatsNumerator = useBeatGridStore(s => s.setBeatsNumerator);
  const setBeatsDenominator = useBeatGridStore(s => s.setBeatsDenominator);
  React.useEffect(() => {
    if (timeSig && typeof timeSig.num === 'number') {
      setBeatsNumerator(Number(timeSig.num));
    }
    if (timeSig && typeof timeSig.den === 'number') {
      setBeatsDenominator(Number(timeSig.den));
    }
  }, [timeSig, setBeatsNumerator, setBeatsDenominator]);

  // const handleFileUpload = () => {
  //   const input = document.createElement('input');
  //   input.type = 'file';
  //   input.accept = 'audio/*';
  //   input.onchange = async (e: any) => {
  //     const files = e.target.files;
  //     if (files && files.length > 0) {
  //       for (let i = 0; i < files.length; i++) {
  //         const f: File | null = files.item(i);
  //         if (!f) continue;
  //         try {
  //           const arrayBuffer = await f.arrayBuffer();
  //           const data = new Uint8Array(arrayBuffer);
  //           try {
  //             filesToProcess.current = filesToProcess.current || [];
  //             filesToProcess.current.push({ filename: f.name, data, processed: false });
  //           } catch (err) {
  //             console.warn('filesToProcess push failed:', err);
  //           }
  //           try {
  //             if (chuckRef && chuckRef.current) {
  //               await chuckRef.current.createFile('', f.name, arrayBuffer);
  //             }
  //           } catch (err) {
  //             console.warn('Chuck createFile failed:', err);
  //           }
  //           try {
  //             uploadedBlob.current = new Blob([arrayBuffer], { type: f.type || 'audio/wav' });
  //           } catch (err) {}
  //           console.log('Files selected and processed:', f.name);
  //         } catch (err) {
  //           console.error('Failed to read file:', err);
  //         }
  //       }
  //     }
  //   };
  //   input.click();
  // };

  return (
    <Box 
      sx={{  
        display: 'flex', 
        flexDirection: 'row' 
      }}
    >
      {/* <Button
        startIcon={<FileUploadIcon />}
        onClick={handleFileUpload}
        sx={{
          backgroundColor: '#3f51b5',
          color: '#fff',
          minWidth: '100px',
          height: '36px',
          padding: '8px',
          margin: '8px 8px 8px 0px',
          '&:hover': {
            backgroundColor: '#303f9f',
          },
        }}
      >
        File
      </Button> */}
      <Box
        sx={{
          width: '100%',
          // padding: 2,
          backgroundColor: 'rgba(10,10,14,0.95)',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'row',
          // gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: '#e0e0e0',
              fontSize: 14,
              mb: 1,
            }}
          >
            BPM: {bpm}
          </Typography>
          <TextField
            size="small"
            value={bpm}
            onWheel={(e) => { e.preventDefault(); }}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!Number.isNaN(val) && val > 0) setBpm(val);
            }}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { color: '#e0e0e0' } }}
            sx={{ width: '100%', background: '#1a1a1a', '& .MuiInputBase-input': { color: '#e0e0e0' } }}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              color: '#e0e0e0',
              fontSize: 14,
              mb: 1,
            }}
          >
            Time Signature: {timeSig.num}/{timeSig.den}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button
                size="small"
                onClick={() => {
                  const next = Math.max(1, Number(timeSig.num) - 1);
                  setTimeSig({ num: next, den: timeSig.den });
                  // Also update beat grid store to keep grid in sync
                  const setBeats = useBeatGridStore.getState().setBeatsNumerator;
                  try { setBeats(next); } catch (e) {}
                }}
                sx={{ minWidth: 28, height: 28, padding: '4px' }}
              >
                -
              </Button>
              <Box sx={{ width: 44, textAlign: 'center', color: '#e0e0e0', border: '1px solid #444', borderRadius: 1, py: '4px', background: '#1a1a1a' }}>
                {timeSig.num}
              </Box>
              <Button
                size="small"
                onClick={() => {
                  const next = Math.min(32, Number(timeSig.num) + 1);
                  setTimeSig({ num: next, den: timeSig.den });
                  const setBeats = useBeatGridStore.getState().setBeatsNumerator;
                  try { setBeats(next); } catch (e) {}
                }}
                sx={{ minWidth: 28, height: 28, padding: '4px' }}
              >
                +
              </Button>
            </Box>

            <span style={{ color: '#e0e0e0' }}>/</span>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button
                size="small"
                onClick={() => {
                  // move denominator to previous allowed value
                  const allowed = [1,2,4,8,16,32];
                  const cur = Number(timeSig.den);
                  const idx = Math.max(0, allowed.indexOf(cur));
                  const next = allowed[Math.max(0, idx - 1)];
                  setTimeSig({ num: timeSig.num, den: next });
                  const setDen = useBeatGridStore.getState().setBeatsDenominator;
                  try { setDen(next); } catch (e) {}
                }}
                sx={{ minWidth: 28, height: 28, padding: '4px' }}
              >
                -
              </Button>
              <Box sx={{ width: 44, textAlign: 'center', color: '#e0e0e0', border: '1px solid #444', borderRadius: 1, py: '4px', background: '#1a1a1a' }}>
                {timeSig.den}
              </Box>
              <Button
                size="small"
                onClick={() => {
                  const allowed = [1,2,4,8,16,32];
                  const cur = Number(timeSig.den);
                  const idx = Math.max(0, allowed.indexOf(cur));
                  const next = allowed[Math.min(allowed.length - 1, idx + 1)];
                  setTimeSig({ num: timeSig.num, den: next });
                  const setDen = useBeatGridStore.getState().setBeatsDenominator;
                  try { setDen(next); } catch (e) {}
                }}
                sx={{ minWidth: 28, height: 28, padding: '4px' }}
              >
                +
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}








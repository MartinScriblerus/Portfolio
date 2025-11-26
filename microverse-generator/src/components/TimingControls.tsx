'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useTransportStore } from '../store/useTransportStore';
import { useTimingStore } from '../hooks/useTimingStore';

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

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        console.log('Files selected:', files);
        // Handle file upload
      }
    };
    input.click();
  };

  return (
    <Box
      sx={{
        width: '100%',
        // padding: 2,
        backgroundColor: 'rgba(10,10,14,0.95)',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        // gap: 2,
      }}
    >
      <Button
        startIcon={<FileUploadIcon />}
        onClick={handleFileUpload}
        sx={{
          backgroundColor: '#3f51b5',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#303f9f',
          },
        }}
      >
        Upload Audio
      </Button>

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
        <input
          type="range"
          min="60"
          max="200"
          step="1"
          value={bpm}
          onChange={(e) => {
            const newBpm = Number(e.target.value);
            setBpm(newBpm);
          }}
          style={{ width: '100%' }}
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
          <input
            type="number"
            min="1"
            max="32"
            value={timeSig.num}
            onChange={(e) => setTimeSig({ num: Number(e.target.value), den: timeSig.den })}
            style={{
              width: 60,
              padding: '4px',
              background: '#1a1a1a',
              color: '#e0e0e0',
              border: '1px solid #444',
              borderRadius: 4,
            }}
          />
          <span style={{ color: '#e0e0e0' }}>/</span>
          <input
            type="number"
            min="1"
            max="32"
            value={timeSig.den}
            onChange={(e) => {
              const den = Number(e.target.value);
              if ([1, 2, 4, 8, 16, 32].includes(den)) {
                setTimeSig({ num: timeSig.num, den });
              }
            }}
            style={{
              width: 60,
              padding: '4px',
              background: '#1a1a1a',
              color: '#e0e0e0',
              border: '1px solid #444',
              borderRadius: 4,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}







"use client";

import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { OBERHEIM_TEAL, SLATE_GRAY } from '../../constants';
import { AnimatedTitle } from './OldAnimatedTitle';
// import OldKeySelector from './OldKeySelector';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

type OldLaunchScreenProps = {
  onStart: () => void;
  isInitializing?: boolean;
};

const OldLaunchScreen: React.FC<OldLaunchScreenProps> = ({ onStart, isInitializing = false }) => {
  return (
    <Box sx={{ 
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      pointerEvents: 'auto',
      background: 'rgba(0,0,0,0.85)'
    }}>
      <AnimatedTitle clickedBegin={false} />
      {/* <Box sx={{ mt: 2, mb: 1 }}>
        <OldKeySelector value={audioKey} onChange={onKeyChange} />
      </Box> */}
      <Button
        sx={{
          width: '120px',
          height: '68px',
          fontFamily: 'monospace',
          fontSize: '(16/9)em !important',
          background: OBERHEIM_TEAL,
          // padding: '16px',
          margin: '4px',
          pointerEvents: 'auto',
          zIndex: 9999,
          color: 'rgba(255,255,255,0.78)',
          cursor: 'pointer',
          border: 'rgba(255,255,255,0.78)',
          '&:hover': { color: '#f5f5f5 !important', 
            border: SLATE_GRAY },
        }}
        variant="contained"
        id="initChuckButton"
        onClick={onStart}
        startIcon={isInitializing ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
        disabled={isInitializing}
      >
        {isInitializing ? 'STARTING...' : 'START'}
      </Button>
    </Box>
  );
};

export default OldLaunchScreen;

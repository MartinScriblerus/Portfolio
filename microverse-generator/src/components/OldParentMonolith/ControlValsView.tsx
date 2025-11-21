import React from 'react';
import { Box } from '@mui/material';

type ControlValsViewProps = {
  updateKeyScaleChord: (...args: any[]) => void;
  files: any[];
};

// Minimal shim to avoid breaking legacy UI; expand if needed
const ControlValsView: React.FC<ControlValsViewProps> = ({ files }) => {
  return (
    <Box sx={{ color: 'rgba(245,245,245,0.78)', fontFamily: 'monospace', p: 1 }}>
      <div>Control Values</div>
      <div style={{ fontSize: 12 }}>Files loaded: {Array.isArray(files) ? files.length : 0}</div>
    </Box>
  );
};

export default ControlValsView;

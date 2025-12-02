import React from 'react';
import { Box } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';

type Props = {
  show: boolean;
  onBack: () => void;
};

export default function OldBackToSynthButton({ show, onBack }: Props) {
  if (!show) return null;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'row',
        position: 'absolute',
        cursor: 'pointer',
        bottom: '40px',
        right: '180px',
        zIndex: '99999',
        pointerEvents: 'auto',
        whiteSpace: 'nowrap',
        fontSize: '12px',
      }}
    >
      <ArrowBack onClick={onBack} />
    </Box>
  );
}

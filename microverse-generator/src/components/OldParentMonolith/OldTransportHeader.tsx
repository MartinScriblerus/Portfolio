import React from 'react';
import { Box } from '@mui/material';
import ClockCounter from './OldClockCounter';
import { Chuck } from 'webchuck';

type OldTransportHeaderProps = {
  chuckHook?: Chuck;
  isChuckRunning: boolean;
  currentPatternCount: number;
  currentDenomCount: number;
  currentNumerCountColToDisplay: number;
  currentBeatCountToDisplay: number;
  numeratorSignature: number;
  clockCounterKey: string;
};

const OldTransportHeader: React.FC<OldTransportHeaderProps> = ({
  chuckHook,
  isChuckRunning,
  currentPatternCount,
  currentDenomCount,
  currentNumerCountColToDisplay,
  currentBeatCountToDisplay,
  numeratorSignature,
  clockCounterKey,
}) => {
  if (!chuckHook || !isChuckRunning) return null;
  return (
    <Box
      id="oldTransportHeaderClockCounterWrapper"
      sx={{ 
        position: 'absolute', 
        width: 'calc(100% - 240px)',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <ClockCounter
        chuckHook={chuckHook}
        currentPatternCount={currentPatternCount}
        currentDenomCount={currentDenomCount}
        currentNumerCountColToDisplay={currentNumerCountColToDisplay}
        currentBeatCountToDisplay={currentBeatCountToDisplay}
        numeratorSignature={numeratorSignature}
        clockCounterKey={clockCounterKey}
      />
    </Box>
  );
};

export default OldTransportHeader;

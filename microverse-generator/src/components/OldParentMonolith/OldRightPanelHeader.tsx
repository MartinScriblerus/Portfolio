import React from 'react';
import { Box, Button } from '@mui/material';
import GroupToggle from './OldGroupToggle';
import OldKeySelector from './OldKeySelector';

type OldRightPanelHeaderProps = {
  universalSourceNames: string[];
  onSourceToggle: (name: string, val: any) => void;
  rightPanelOptions: string[];
  onTogglePanel: (panel: string) => void;
  audioKey: string;
  onKeyChange: (key: string) => void;
};

const OldRightPanelHeader: React.FC<OldRightPanelHeaderProps> = ({
  universalSourceNames,
  onSourceToggle,
  rightPanelOptions,
  onTogglePanel,
  audioKey,
  onKeyChange,
}) => {
  const isEffects = rightPanelOptions[0] === 'effects';
  return (
    <Box id="rightPanelHeader">
      {/* {universalSourceNames && universalSourceNames.length > 0 && ( */}
        <GroupToggle
          name={"Sources"}
          options={universalSourceNames}
          handleSourceToggle={onSourceToggle}
        />
      {/* )} */}

      <Box
        className="right-panel-header-wrapper"
        sx={{
          border: `1px solid rgba(0,0,0,0.78)`,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ mr: 2, ml: 1 }}>
          <OldKeySelector value={audioKey} onChange={onKeyChange} />
        </Box>
        <Button
          id="toggleSliderPanelChildren_Effects"
          className="right-panel-header-button"
          sx={{ backgroundColor: isEffects ? 'rgba(255,255,255,0.278)' : 'transparent' }}
          onClick={() => onTogglePanel('effects')}
        >
          Effects View
        </Button>
        <Button
          id="toggleSliderPanelChildren_Pattern"
          className="right-panel-header-button"
          sx={{ backgroundColor: !isEffects ? 'rgba(255,255,255,0.278)' : 'transparent' }}
          onClick={() => onTogglePanel('pattern')}
        >
          Patterns View
        </Button>
      </Box>
    </Box>
  );
};

export default OldRightPanelHeader;

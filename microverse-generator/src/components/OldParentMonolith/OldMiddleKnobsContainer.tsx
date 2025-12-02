import React from 'react';
import { Box } from '@mui/material';
import ControlValsView from './ControlValsView';
import OldManageFXPanel from './OldManageFXPanel';
import BabylonLayer from './OldBabylonLayer';
import OldBackToSynthButton from './OldBackToSynthButton';
import PedalboardOverlayFromOld from '../PedalboardOverlayFromOld';

type Props = {
  controlView: string;
  files: any;
  updateKeyScaleChord: (a: any, b?: any, c?: any, d?: any, e?: any, f?: any) => void;
  showBack: boolean;
  onBack: () => void;
  isManagingEffects: boolean;
  stkValues: any[];
  selectedEffects: any[];
  handleViewSTK: (e: any) => void;
  handleViewEffect: (e: any) => void;
  // Babylon props
  boxKey: string;
  babylonReady: boolean;
  bpm: number;
  handleUpdateSliderVal: (x: string, index: number, value: any) => void;
  fxKnobsCount: number;
  effects: any;
  visibleFXKnobs: any;
  chuckUpdateNeeded: boolean;
  chuckHook: any;
  hasHexKeys: boolean;
  showFX: boolean;
  programIsOn: boolean;
  microTonalArr: any;
  updateHasHexKeys: (v: boolean) => void;
  fxRadioValue: string;
  currentBeatCountToDisplay: number;
};

function OldMiddleKnobsContainer({
  controlView,
  files,
  updateKeyScaleChord,
  showBack,
  onBack,
  isManagingEffects,
  stkValues,
  selectedEffects,
  handleViewSTK,
  handleViewEffect,
  boxKey,
  babylonReady,
  bpm,
  handleUpdateSliderVal,
  fxKnobsCount,
  effects,
  visibleFXKnobs,
  chuckUpdateNeeded,
  chuckHook,
  hasHexKeys,
  showFX,
  programIsOn,
  microTonalArr,
  updateHasHexKeys,
  fxRadioValue,
  currentBeatCountToDisplay,
}: Props) {

  return (
    <Box id={'middleKnobsContainer'} sx={{ position: 'relative', marginLeft: '140px' }}>
      {controlView !== 'knobsView' ? (
        <Box sx={{ top: '54px', width: '100%', height: '100%', boxSizing: 'border-box', padding: '0px', margin: '0px' }}>
          <ControlValsView updateKeyScaleChord={updateKeyScaleChord} files={files} />
        </Box>
      ) : (
        <Box sx={{ boxSizing: 'border-box', width: '100%', height: '100%' }} key={boxKey}>
          <OldBackToSynthButton show={showBack} onBack={onBack} />

          {isManagingEffects && (
            <OldManageFXPanel stkValues={stkValues as any} selectedEffects={selectedEffects as any} handleViewSTK={handleViewSTK} handleViewEffect={handleViewEffect} />
          )}

        <PedalboardOverlayFromOld
            visibleFXKnobs={visibleFXKnobs}
            fxKnobsCount={fxKnobsCount}
            fxRadioValue={fxRadioValue}
            handleUpdateSliderVal={handleUpdateSliderVal}
        />

          {/* {babylonReady && (
            <BabylonLayer
              currentBeatCountToDisplay={currentBeatCountToDisplay}
              bpm={bpm}
              handleUpdateSliderVal={handleUpdateSliderVal}
              fxKnobsCount={fxKnobsCount}
              effects={effects}
              visibleFXKnobs={visibleFXKnobs}
              chuckUpdateNeeded={chuckUpdateNeeded}
              chuckHook={chuckHook}
              hasHexKeys={hasHexKeys}
              showFX={showFX}
              programIsOn={programIsOn}
              microTonalArr={microTonalArr}
              updateHasHexKeys={updateHasHexKeys}
              fxRadioValue={fxRadioValue || 'osc1'}
            />
          )} */}
        </Box>
      )}
    </Box>
  );
}

export default React.memo(OldMiddleKnobsContainer);

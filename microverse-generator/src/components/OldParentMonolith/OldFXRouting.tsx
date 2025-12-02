import React, { SetStateAction, useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/system';
import FXCheckboxLabels from './OldFXCheckboxes';
import { STKOption } from './oldFixedOptionsDropdownData';
import "../../../app/globals.css";
import { handleFXGroupChange } from '../../utils/knobsHelper';
interface PedalboardNode {
  id: string;
  name: string;
  group: string;
}

interface PedalboardLink {
}

interface PedalboardNodesObj {
  Osc1: PedalboardNode[] | [],
  // Osc2: PedalboardNode[] | [],
  STK: PedalboardNode[] | [],
  Sampler: PedalboardNode[] | [],
  AudioIn: PedalboardNode[] | []
}

interface PedalboardLinksObj {
  Osc1: PedalboardLink[] | [],
  // Osc2: PedalboardLink[] | [],
  STK: PedalboardLink[] | [],
  Sampler: PedalboardLink[] | [],
  AudioIn: PedalboardLink[] | []
}

interface PedalboardData {
  nodes: [PedalboardNodesObj] | [];
  links: [PedalboardLinksObj] | [];
}

interface FXRoutingProps {
  fxData: any;
  width: number;
  height: number;
  // handleFXGroupChange: (e: any) => void;
  updateCheckedFXList: (e: any) => void;
  fxGroupsArrayList: Array<any>;
  checkedFXList: Array<any>;
  fxFX: any;
  handleClickName: (e: string, op: string) => void;
  setClickFXChain: React.Dispatch<any>;
  clickFXChain: boolean;
  updateFXInputRadio: (value: any) => void;
  fxRadioValue: string;
  playUploadedFile: () => void;
  // updateStkKnobs: (knobVals: any) => void;
  setStkValues: React.Dispatch<SetStateAction<any>>;
  stkValues: STKOption[] | [];
  currentScreen: string;
  lastFileUpload: string;
  updateFileUploads: (e: any) => void;
  handleCheckedFXToShow: (x:any) => void;
  checkedEffectsListHook: any;
  setCheckedEffectsListHook: React.Dispatch<SetStateAction<any>>;
}

export default function FXRouting(props: FXRoutingProps) {
  const {
    // handleFXGroupChange,
    updateCheckedFXList,
    fxGroupsArrayList,
    checkedFXList,
    fxFX,
    handleCheckedFXToShow,
    checkedEffectsListHook,
    
    setCheckedEffectsListHook,
  } = props;

  const data = useRef<PedalboardData | any>({
    nodes: {},
    links: {}
  });

  const nodesRef = useRef<any>({
    Osc1: [],
    // Osc2: [],
    STK: [],
    Sampler: [],
    AudioIn: []
  });

  const linksRef = useRef<any>({
    Osc1: [],
    // Osc2: [],
    STK: [],
    Sampler: [],
    AudioIn: []
  });

  const theme = useTheme();

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      maxHeight: "calc(100vh - 204px)",
      // width: "180px",
      overflowY: "auto",
      zIndex: 1
    }}>          
        <FXCheckboxLabels
          fxValsRef={fxFX}
          handleFXGroupChange={handleFXGroupChange}
          updateCheckedFXList={updateCheckedFXList}
          fxGroupsArrayList={fxGroupsArrayList}
          checkedFXList={checkedFXList}
          handleCheckedFXToShow={handleCheckedFXToShow} 
          checkedEffectsListHook={checkedEffectsListHook}
          setCheckedEffectsListHook={setCheckedEffectsListHook}
        />
      <Box
        key={`arcDiagramOuterWrapper_${Object.values(linksRef.current).map((l: any) => l.source + "_")}`}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          zIndex: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          color: 'rgba(147, 206, 214, 1)'
        }}>
        </Box>
      </Box>
    </Box>
  );
}


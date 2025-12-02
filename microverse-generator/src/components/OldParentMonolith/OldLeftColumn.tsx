import React, { useState } from 'react';
import { Box } from '@mui/material';
import FileManager from './OldFileManager';
import BPMModule from './OldBPMModule';
import STKManagerDropdown from './OldSTKManagerDropdown';
import FXRouting from './OldFXRouting';

type OldLeftColumnProps = {
  onUpload?: (files: FileList | null) => Promise<void>;
  onSubmit: (files: any) => void;
  chuckHook: any;
  FileUploadIcon: any;
  showBPM: boolean;
  updateStkKnobs: (vals: any) => void;
  stkValues: any[];
  setStkValues: React.Dispatch<React.SetStateAction<any[]>>;
  fXChainKey: string;
  fxRadioValue: any;
  fxData: any;
  handleUpdateCheckedFXList: (e: any) => void;
  fxGroupOptions: any[];
  checkedFXListCurrent: any[];
  handleClickName: (e: any, op: string) => void;
  setClickFXChain: (v: boolean) => void;
  clickFXChain: boolean;
  updateFXInputRadio: (e: any) => void;
  currentScreenCurrent: string;
  playUploadedFile: (args?: any) => void;
  lastFileUpload: any;
  updateFileUploads: (args?: any) => void;
  handleCheckedFXToShow: (msg: any) => void;
  checkedEffectsListHook: string[];
  setCheckedEffectsListHook: (vals: string[]) => void;
  onBpmDetected: (bpm: number | null) => void;
};

export default function OldLeftColumn(props: OldLeftColumnProps) {
  const {
    onUpload,
    onSubmit,
    chuckHook,
    FileUploadIcon,
    showBPM,
    updateStkKnobs,
    stkValues,
    setStkValues,
    fXChainKey,
    fxRadioValue,
    fxData,
    handleUpdateCheckedFXList,
    fxGroupOptions,
    checkedFXListCurrent,
    handleClickName,
    setClickFXChain,
    clickFXChain,
    updateFXInputRadio,
    currentScreenCurrent,
    playUploadedFile,
    lastFileUpload,
    updateFileUploads,
    handleCheckedFXToShow,
    checkedEffectsListHook,
    setCheckedEffectsListHook,
    onBpmDetected
  } = props;

  return (
    <Box id="leftContainerWrapper">
      <FileManager 
        // onSubmit={onSubmit} 
        onSubmit={filesObj => onUpload?.(filesObj?.file ?? null)}
        chuckHook={chuckHook} 
        FileUploadIcon={FileUploadIcon} 
        onBpmDetected={onBpmDetected} 
        />
      {/* {showBPM && (
        <BPMModule
          bpm={bpm}
          beatsNumerator={beatsNumerator}
          beatsDenominator={beatsDenominator}
        />
      )} */}
      {/* <Box sx={{ padding: '8px', backgroundColor: 'rgba(28,28,28,0.78)' }}>
        <STKManagerDropdown updateStkKnobs={updateStkKnobs} stkValues={stkValues} setStkValues={setStkValues} />
      </Box> */}
      <Box sx={{ position: 'relative', color: 'rgba(255,255,255,0.78)' }}>
          <FXRouting
            key={fXChainKey + fxRadioValue}
            fxData={fxData}
            width={440}
            height={440}
            updateCheckedFXList={handleUpdateCheckedFXList}
            fxGroupsArrayList={fxGroupOptions}
            checkedFXList={checkedFXListCurrent}
            fxFX={[]}
            handleClickName={handleClickName}
            setClickFXChain={setClickFXChain}
            clickFXChain={clickFXChain}
            updateFXInputRadio={updateFXInputRadio}
            fxRadioValue={fxRadioValue}
            setStkValues={setStkValues}
            stkValues={stkValues}
            currentScreen={currentScreenCurrent}
            playUploadedFile={playUploadedFile}
            lastFileUpload={lastFileUpload}
            updateFileUploads={updateFileUploads}
            handleCheckedFXToShow={handleCheckedFXToShow}
            checkedEffectsListHook={checkedEffectsListHook}
            setCheckedEffectsListHook={setCheckedEffectsListHook}
          />
      </Box>
    </Box>
  );
}

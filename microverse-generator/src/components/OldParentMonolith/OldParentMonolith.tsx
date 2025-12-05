// @ts-nocheck
"use client"

import { useTransportStore } from '../../store/useTransportStore';
import { computeGridConfig } from '../../utils/gridMath';
import { deriveGridParams } from '../../utils/siteHelpers';
import { WaveformCanvas } from '../WaveformCanvas';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';
import dynamic from 'next/dynamic';
import EffectDropdown from '../EffectsDropdown';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Box, Select, Button, Typography, ButtonGroup } from '@mui/material';
import { ACCESSIBLE_COLORS } from '../../utils/accessibilityColors';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import CloseIcon from '@mui/icons-material/Close';

import OldTransportHeader from './OldTransportHeader';
import OldLaunchScreen from './OldLaunchScreen';
import OldLeftColumn from './OldLeftColumn';
import OldMiddleKnobsContainer from './OldMiddleKnobsContainer';
import OldKeyboardPanel from './OldKeyboardPanel';
// import ReactDiagramsPedalboard from './OldReactDiagramsPedalboard';
const ReactDiagramsPedalboard = dynamic(() => import('../../../src/components/ReactDiagramsPedalboardClean').then(m=>m.default), { ssr:false });
import BeatGridPanel from '../BeatGrid/BeatGridPanel';
import TimingControls from '../TimingControls';
import MeydaHUD from './MeydaHUD';

import { getChainForSource } from './OldFacade';
import { filesToProcess, universalSources, moogGrandmotherEffects, uploadedBlob, chuckRef } from '../../../app/state/refs';
import { useKnobModel } from './useKnobModel';
import { useFileUploads } from './useFileUploads';
import { useOldMonolithStore } from '../../store/useOldMonolithStore';
import { useBeatGridStore } from '../../store/useBeatGridStore';
import { useMicrotonalStore } from '../../store/useMicrotonalStore';
import AudioMixer from './OldAudioMixer';
import FXRouting from './OldFXRouting';
import STKManagerDropdown from './OldSTKManagerDropdown';
import useAudioAnalysisAndMIDI from './useAudioAnalysisAndMIDI';
// import Streamgraph from '../VizxHelpers/Steamgraph'; // Temporarily disabled - data format mismatch
// import BrushChart from '../VizxHelpers/BrushChart'; // Available if needed
import type { Chuck } from 'webchuck';

  
type RightDrawerProps = {
  isChuckRunning: boolean;
  featuresLegendData: any[];
  universalSources: any;
  vizSource: string;
  currentBeatSynthCount: any;
  handleOsc1RateUpdate: any;
  handleMasterFastestRate: any;
  handleStkRateUpdate: any;
  handleSamplerRateUpdate: any;
  handleAudioInRateUpdate: any;
  currentNoteVals: any;
  filesToProcess: any;
  beatsNumerator: number;
  beatsDenominator: number;
  editPattern: any;
  masterPatternsHashHook: any;
  masterPatternsHashHookUpdated: any;
  inPatternEditMode: any;
  selectFileForAssignment: any;
  handleChangeCellSubdivisions: any;
  cellSubdivisions: any;
  resetCellSubdivisionsCounter: any;
  handleClickUploadedFiles: any;
  parentDiv: HTMLDivElement | null;
  currentBeatCountToDisplay: number;
  currentNumerCountColToDisplay: number;
  currentDenomCount: number;
  currentPatternCount: number;
  clickHeatmapCell: (x: number, y: number, subDiv: number) => void;
  handleLatestSamples: any;
  handleLatestNotes: any;
  mTFreqs: number[];
  mTMidiNums: number[];
  updateKeyScaleChordBG: any;
  handleAssignPatternNumber: any;
  doAutoAssignPatternNumber: number;
  setStkValues: any;
  currentMicroTonalScaleBG: any;
  setFxKnobsCount: any;
  doUpdateBabylonKey: any;
  babylonKey: string;
  updateCurrentFXScreen: any;
  getSTK1Preset: any;
  universalSourcesRef: any;
  updateMicroTonalScale: any;
  mingusKeyboardData: any;
  mingusChordsData: any;
  updateMingusData: any;
  handleChangeNotesAscending: any;
  mTNames: string[];
  fxRadioValue: string;
  noteBuilderFocusBG: string;
  handleNoteBuilder: any;
  handleNoteLengthUpdate: any;
  handleNoteVelocityUpdate: any;
  currentSelectedCell: { x: number; y: number };
  octaveMax: number;
  octaveMin: number;
  uploadedBlobRef: any;
  getMeydaData: any;
  clickedFileRef: any;
  globalChuckRef: any;
  setDetectedBpm: (bpm: number | null) => void;
  selectedDeviceId: string;
  updateAudioInputDevice: (deviceId: string) => void;
  deviceOptions: MediaDeviceInfo[];
  showAudioInDropdown: boolean;
  updateSelectedAudioInSetting: (deviceId: string) => void;
  chuckHook: any;
};

// Editing Mode Toggle Component - Fixed to prevent re-renders
// const EditingModeToggle = React.memo(() => {
//   const isEditing = useBeatGridStore((s) => s.isEditing);
//   const setIsEditing = useBeatGridStore((s) => s.setIsEditing);
  
//   return (
//     <Box sx={{ padding: '8px', borderTop: '1px solid #333', borderBottom: '1px solid #333' }}>
//       <button
//         onClick={() => setIsEditing(!isEditing)}
//         style={{
//           width: '100%',
//           padding: '10px',
//           background: isEditing ? 'rgba(98, 245, 255, 0.3)' : 'rgba(40, 40, 40, 0.8)',
//           border: `2px solid ${isEditing ? '#62f5ff' : '#666'}`,
//           borderRadius: '6px',
//           color: '#e0e0e0',
//           cursor: 'pointer',
//           fontSize: '14px',
//           fontWeight: 'bold',
//           transition: 'all 0.2s',
//         }}
//       >
//         {isEditing ? '✓ Editing Mode ON' : '✗ Editing Mode OFF'}
//       </button>
//     </Box>
//   );
// });
// EditingModeToggle.displayName = 'EditingModeToggle';

function RightDrawer(props: RightDrawerProps) {
  const [tab, setTab] = useState<'grid' | 'mixer' | 'fx'>('grid');
  const [open, setOpen] = useState(true);
  
  // Update CSS variable for keyboard positioning when drawer state changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--keyboard-right-offset', open ? '420px' : '0px');
      document.documentElement.style.setProperty('--keyboard-width', open ? 'calc(100% - 560px)' : 'calc(100% - 140px)');
    }
  }, [open]);
  const latestTimeDomainRef = useRef<Float32Array | null>(null);
  
  // Extract device-related props
  const {
    selectedDeviceId,
    updateAudioInputDevice,
    deviceOptions,
    showAudioInDropdown,
    updateSelectedAudioInSetting,
    chuckHook,
    globalChuckRef
  } = props;
  
  // Use globalChuckRef for EffectDropdown (imported chuckRef is module-level, use prop instead)
  const chuckRefForEffect = globalChuckRef;
  
  // Get Meyda audio analysis data for visualizations
  const chuckHookRefForMeyda = useRef(chuckHook);
  useEffect(() => {
    chuckHookRefForMeyda.current = chuckHook;
  }, [chuckHook]);
  // Debugging: track incoming frame rate and last frame timestamp
  const [debugFps, setDebugFps] = useState<number>(0);
  const lastFrameTsRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const fpsWindowStartRef = useRef<number | null>(null);

  const { meydaData } = useAudioAnalysisAndMIDI(
    chuckHookRefForMeyda as any,
    [chuckHook],
    (audioData: Float32Array) => {
      // Update ref for WaveformCanvas to consume (copy to avoid mutation issues)
      latestTimeDomainRef.current = audioData;

      // Update debug counters
      const now = performance.now();
      lastFrameTsRef.current = now;
      frameCountRef.current = (frameCountRef.current || 0) + 1;
      if (!fpsWindowStartRef.current) fpsWindowStartRef.current = now;
      const windowMs = now - fpsWindowStartRef.current;
      if (windowMs >= 500) {
        const fps = Math.round((frameCountRef.current * 1000) / windowMs);
        setDebugFps(fps);
        frameCountRef.current = 0;
        fpsWindowStartRef.current = now;
      }
    }
  );
  
  // Get clickedBegin from store
  const clickedBegin = useOldMonolithStore(s => s.clickedBegin);
  
  // Get other needed values from store or props
  const universalSourcesCurrent = props.universalSources || {};
  const [expandedMixerSource, setExpandedMixerSource] = useState('');
  
  // Stub functions for mixer controls (these should ideally be passed as props or use store)
  const handleUpdateVolumes = (_: string, __: number) => {};
  const handleUpdatePans = (_: string, __: number) => {};
  const handleToggleMutes = (_: string) => {};
  const handleToggleSolos = (_: string) => {};
  
  // FX tab related variables and functions
  const fxRadioValue = props.fxRadioValue || useOldMonolithStore(s => s.fxRadioValue);
  const setFxRadioValue = useOldMonolithStore(s => s.setFxRadioValue);
  const [stkValues, setStkValues] = useState<any[]>([]);
  const updateStkKnobs = () => {}; // Stub function - should be implemented or passed as prop
  const [clickFXChain, setClickFXChain] = useState('');
  const handleClickName = () => {};
  const updateFXInputRadio = (value: string) => {
    setFxRadioValue(value as any);
  };
  const handleUpdateCheckedFXList = () => {};
  const handleCheckedFXToShow = () => {};
  const [checkedEffectsListHook, setCheckedEffectsListHook] = useState<any[]>([]);
  const universalSourcesRef = props.universalSourcesRef || { current: props.universalSources || {} };
  const currentChain = universalSourcesRef.current?.[fxRadioValue]?.effects || {};
  const getNewFX = () => {};
  const playUploadedFile = () => {};
  const lastFileUpload = useRef(null);
  const updateFileUploads = () => {};

  // Debug: Log when drawer mounts/updates - REMOVED masterPatternsHashHook from deps to prevent loops
  useEffect(() => {
    console.log('[RightDrawer] Mounted, open:', open, 'tab:', tab);
  }, [open, tab]);

  useGlobalShortcuts({
    toggleGrid: () => { setOpen(true); setTab('grid'); },
    toggleMixer: () => { setOpen(true); setTab('mixer'); },
    toggleFx: () => { setOpen(true); setTab('fx'); },
  });

  // Select values individually to avoid creating new object on every render
  const bpm = useTransportStore(s => s.bpm);
  const timeSig = useTransportStore(s => s.timeSig);
  const stepsPerBeat = useTransportStore(s => s.stepsPerBeat);
  const grid = computeGridConfig(timeSig, stepsPerBeat, 1);

  const { 
    beatsPerMeasure: derivedBeatsPerMeasure, 
    stepsPerBeat: derivedStepsPerBeat, 
    stepsPerMeasure } =
  deriveGridParams(timeSig.num, timeSig.den);

  return (
    <>
      {/* Floating toggle button when drawer is closed */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setTab('grid'); }}
          aria-label="Open grid panel"
          style={{
            position: 'absolute',
            left: 348,
            top: 22,
            height: 28,
            transform: 'translateY(-50%)',
            zIndex: 31,
            // padding: '12px 16px',
            background: '#444',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Grid →
        </button>
      )}
      <aside
        aria-label="Composer tools"
        style={{
          position: 'fixed',
          right: open ? 0 : -420,
          top: 0,
          bottom: 0,
          width: 420,
          transition: 'right 180ms ease',
          background: 'rgba(10,10,14,0.98)',
          borderLeft: '2px solid #444',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10001,
          pointerEvents: 'auto',
          boxShadow: open ? '-4px 0 20px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <header style={{ padding: '8px 12px', borderBottom: '1px solid #222' }}>
          <Button sx={{
            position: !open ? 'absolute' : 'relative',
            top:  !open ? 24 : 'auto',
            right: !open ? 24 : 'auto',
            zIndex: 99999,
            pointerEvents: 'auto',
            pointer: 'cursor',
            background: 'rgba(0,0,0,0.5)',
            color: '#e0e0e0',
            border: '1px solid #444',
          }} onClick={() => setOpen(false)} aria-label="Close panel">
            {
              !open ? <MenuOpenIcon sx={{ fontSize: 24, pointerEvents: 'none' }} /> : <CloseIcon sx={{ fontSize: 24, pointerEvents: 'none'}} />
            }
          </Button>
          <Box style={{ 
            display: 'inline-flex', 
            gap: 8, 
            marginLeft: 8,
            pointerEvents: 'auto',
            zIndex: 9999,
          }}
        >
            <Button sx={{
              pointerEvents: 'auto',
              pointer: 'cursor',
              zIndex: 99999,
            }} onClick={() => { setOpen(true); setTab('grid'); }} aria-pressed={tab === 'grid'} aria-label="Open beat grid panel">Grid</Button>
            <Button sx={{
              pointerEvents: 'auto',
              pointer: 'cursor',
              zIndex: 99999,
            }} onClick={() => { setOpen(true); setTab('mixer'); }} aria-pressed={tab === 'mixer'} aria-label="Open audio mixer panel">Mixer</Button>
            <Button sx={{
              pointerEvents: 'auto',
              pointer: 'cursor',
              zIndex: 99999,
            }} onClick={() => { setOpen(true); setTab('fx'); }} aria-pressed={tab === 'fx'} aria-label="Open effects panel">FX</Button>
          </Box>
          <Box sx={{ maxHeight: '200px', overflowY: 'auto'}}>
            <TimingControls />
          </Box>
          {/* isEditing Toggle - Fixed to use hook properly */}
          {/* <EditingModeToggle /> */}
          {/* <div style={{ marginTop: 8 }}> */}
          {/* Debug: always render waveform while troubleshooting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1 }}>
              <WaveformCanvas
                getSamples={() => latestTimeDomainRef.current}
                height={56}
                color="#62f5ff"
              />
            </div>
            <div style={{ minWidth: 80, textAlign: 'right', color: '#9fdfff', fontSize: 11 }}>
              <div style={{ fontWeight: 600 }}>FPS</div>
              <div>{debugFps}</div>
            </div>
          </div>
            {/* } */}
          {/* </div> */}
        </header>

      <main style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {tab === 'grid' && (
          <div style={{ padding: 4, zIndex: 999999, minHeight: '100%' }}>
            <Box sx={{ mt: 2, marginTop: 0, minHeight: 400, border: '1px solid #333', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <BeatGridPanel
                bpm={bpm}
                beatsPerMeasure={derivedBeatsPerMeasure}
                stepsPerMeasure={derivedStepsPerBeat}
                stepsPerBeat={stepsPerBeat}
                isChuckRunning={props.isChuckRunning}
                featuresLegendData={props.featuresLegendData}
                universalSources={props.universalSources}
                handleSourceToggle={() => {}}
                vizSource={props.vizSource}
                currentBeatSynthCount={props.currentBeatSynthCount}
                handleOsc1RateUpdate={props.handleOsc1RateUpdate}
                handleMasterFastestRate={props.handleMasterFastestRate}
                handleStkRateUpdate={props.handleStkRateUpdate}
                handleSamplerRateUpdate={props.handleSamplerRateUpdate}
                handleAudioInRateUpdate={props.handleAudioInRateUpdate}
                currentNoteVals={props.currentNoteVals}
                filesToProcess={props.filesToProcess}
                numeratorSignature={props.beatsNumerator}
                denominatorSignature={props.beatsDenominator}
                editPattern={props.editPattern}
                masterPatternsHashHook={props.masterPatternsHashHook}
                masterPatternsHashHookUpdated={props.masterPatternsHashHookUpdated}
                inPatternEditMode={props.inPatternEditMode}
                selectFileForAssignment={props.selectFileForAssignment}
                handleChangeCellSubdivisions={props.handleChangeCellSubdivisions}
                cellSubdivisions={props.cellSubdivisions}
                resetCellSubdivisionsCounter={props.resetCellSubdivisionsCounter}
                handleClickUploadedFiles={props.handleClickUploadedFiles}
                parentDiv={props.parentDiv}
                masterFastestRate={0}
                currentBeatCountToDisplay={props.currentBeatCountToDisplay}
                currentNumerCountColToDisplay={props.currentNumerCountColToDisplay}
                currentDenomCount={props.currentDenomCount}
                currentPatternCount={props.currentPatternCount}
                clickHeatmapCell={props.clickHeatmapCell}
                exitEditMode={() => {}}
                isInPatternEditMode={false}
                handleLatestSamples={props.handleLatestSamples}
                handleLatestNotes={props.handleLatestNotes}
                mTFreqs={props.mTFreqs}
                mTMidiNums={props.mTMidiNums}
                updateKeyScaleChord={props.updateKeyScaleChordBG}
                handleAssignPatternNumber={props.handleAssignPatternNumber}
                doAutoAssignPatternNumber={props.doAutoAssignPatternNumber}
                setStkValues={props.setStkValues}
                tune={{} as any}
                currentMicroTonalScale={props.currentMicroTonalScaleBG}
                setFxKnobsCount={props.setFxKnobsCount}
                doUpdateBabylonKey={props.doUpdateBabylonKey}
                babylonKey={props.babylonKey}
                currentScreen={{ current: 'synth' } as any}
                currentFX={{ current: {} } as any}
                currentStkTypeVar={{ current: '' } as any}
                updateCurrentFXScreen={props.updateCurrentFXScreen}
                getSTK1Preset={props.getSTK1Preset}
                universalSourcesRef={props.universalSourcesRef}
                updateMicroTonalScale={props.updateMicroTonalScale}
                mingusKeyboardData={props.mingusKeyboardData}
                mingusChordsData={props.mingusChordsData}
                updateMingusData={props.updateMingusData}
                handleChangeNotesAscending={props.handleChangeNotesAscending}
                mTNames={props.mTNames}
                fxRadioValue={props.fxRadioValue}
                noteBuilderFocus={props.noteBuilderFocusBG}
                handleNoteBuilder={props.handleNoteBuilder}
                handleNoteLengthUpdate={props.handleNoteLengthUpdate}
                handleNoteVelocityUpdate={props.handleNoteVelocityUpdate}
                currentSelectedCell={props.currentSelectedCell}
                octaveMax={props.octaveMax}
                octaveMin={props.octaveMin}
                uploadedBlob={props.uploadedBlobRef}
                getMeydaData={props.getMeydaData}
                clickedFile={props.clickedFileRef}
                chuckRef={props.globalChuckRef}
                onBpmDetected={(bpm) => props.setDetectedBpm(bpm)}
              />
            </Box>
            <div style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>
              BPM: {bpm} • {timeSig.num}/{timeSig.den} • Steps/Measure: {stepsPerMeasure}
            </div>
          </div>
        )}
        {tab === 'mixer' && (
          <div style={{ padding: 12 }}>
            {/* Audio Mixer - Always visible */}
            {clickedBegin && chuckHook && (
              <Box sx={{ marginBottom: '24px' }}>
                <AudioMixer
                  universalSources={universalSourcesCurrent}
                  handleUpdateVolumes={handleUpdateVolumes}
                  handleUpdatePans={handleUpdatePans}
                  handleToggleMutes={handleToggleMutes}
                  handleToggleSolos={handleToggleSolos}
                  expandedMixerSource={expandedMixerSource}
                  setExpandedMixerSource={setExpandedMixerSource}
                />
              </Box>
            )}

            {/* Device Selector - Moved below mixer */}
            <Box className='select-device-id-wrapper' sx={{ marginBottom: '16px' }}>
              <Typography variant="caption" sx={{ 
                color: 'var(--color-dominant-text, rgba(245,247,250,0.8))',
                display: 'block',
                mb: 1,
                fontSize: '12px'
              }}>
                Audio Input Device
              </Typography>
              <Select
                className='select-device-id-dropdown'
                value={selectedDeviceId}
                onChange={(e: any) => updateAudioInputDevice(e.target.value)}
                native
                sx={{ 
                  cursor: 'pointer',
                  width: '100%',
                  backgroundColor: 'var(--color-dominant-surface, rgba(26,28,32,0.95))',
                  color: 'var(--color-dominant-text, #F5F7FA)',
                  border: '1px solid var(--color-tertiary-muted, rgba(74,85,104,0.5))',
                  borderRadius: '4px',
                  padding: '8px',
                  '&:hover': {
                    borderColor: 'var(--color-subdominant-primary, #00D9FF)',
                  }
                }}
                disabled={!chuckHook}
              >
                <option value="">Select Audio Input Device</option>
                {deviceOptions.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Device ${device.deviceId}`}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Audio In Effect Dropdown
            <Box
              id='effect-dropdown-container'
              sx={{
                pointerEvents: showAudioInDropdown ? 'auto' : 'none',
                opacity: showAudioInDropdown ? 1 : 0.5,
                marginBottom: '16px',
              }}
            >
              <EffectDropdown
                chuckRef={chuckRefForEffect}
                updateSelectedAudioInSetting={(e: any) => updateSelectedAudioInSetting(e)}
                showAudioInDropdown={showAudioInDropdown}
              />
            </Box> */}

            {/* Meyda Visualizations */}
            {meydaData && typeof meydaData === 'object' && (
              <Box sx={{ marginBottom: '16px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px' }}>
                <Typography variant="h6" sx={{ color: ACCESSIBLE_COLORS.subdominant.primary, mb: 1, fontSize: '14px' }}>
                  Audio Analysis
                </Typography>
                
                {/* Spectral Analysis - Streamgraph */}
                {/* Temporarily disabled - Streamgraph expects different data format */}
                {/* {meydaData.amplitudeSpectrum && Array.isArray(meydaData.amplitudeSpectrum) && meydaData.amplitudeSpectrum.length > 0 && (
                  <Box sx={{ marginBottom: '16px' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)', display: 'block', mb: 1 }}>
                      Amplitude Spectrum
                    </Typography>
                    <Streamgraph
                      width={400}
                      height={150}
                      meydaData={meydaData.amplitudeSpectrum}
                      animate={true}
                    />
                  </Box>
                )} */}
                
                {/* Simple Amplitude Spectrum Bar Chart */}
                {meydaData.amplitudeSpectrum && Array.isArray(meydaData.amplitudeSpectrum) && meydaData.amplitudeSpectrum.length > 0 && (
                  <Box sx={{ marginBottom: '16px' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)', display: 'block', mb: 1 }}>
                      Amplitude Spectrum
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-end', 
                      height: '100px', 
                      gap: '1px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      padding: '4px',
                      borderRadius: '2px'
                    }}>
                      {meydaData.amplitudeSpectrum.slice(0, 100).map((amp: number, i: number) => (
                        <Box
                          key={i}
                          sx={{
                            flex: 1,
                            height: `${Math.min(100, Math.max(1, (amp * 1000)))}%`,
                            background: `linear-gradient(to top, ${ACCESSIBLE_COLORS.subdominant.primary}, ${ACCESSIBLE_COLORS.tertiary.warning})`,
                            minHeight: '1px',
                            transition: 'height 0.1s ease-out'
                          }}
                          title={`Freq bin ${i}: ${amp.toFixed(4)}`}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* MFCC Visualization */}
                {meydaData.mfcc && Array.isArray(meydaData.mfcc) && meydaData.mfcc.length > 0 && (
                  <Box sx={{ marginBottom: '16px' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)', display: 'block', mb: 1 }}>
                      MFCC (Mel-Frequency Cepstral Coefficients)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 0.5, height: '60px' }}>
                      {meydaData.mfcc.slice(0, 13).map((v: number, i: number) => (
                        <Box 
                          key={i} 
                          sx={{ 
                            height: '100%', 
                            background: `linear-gradient(to top, ${ACCESSIBLE_COLORS.subdominant.primary} ${Math.min(100, Math.max(0, (v + 50) * 2))}%, transparent ${Math.min(100, Math.max(0, (v + 50) * 2))}%)`,
                            border: `1px solid ${ACCESSIBLE_COLORS.subdominant.primary}`,
                            borderRadius: '2px'
                          }} 
                          title={`MFCC${i+1}: ${v.toFixed(2)}`} 
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Chroma Visualization */}
                {meydaData.chroma && Array.isArray(meydaData.chroma) && meydaData.chroma.length > 0 && (
                  <Box sx={{ marginBottom: '16px' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)', display: 'block', mb: 1 }}>
                      Chroma (Pitch Class)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0.5, height: '40px' }}>
                      {meydaData.chroma.slice(0, 12).map((v: number, i: number) => {
                        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                        return (
                          <Box 
                            key={i} 
                            sx={{ 
                              height: '100%', 
                              background: `linear-gradient(to top, ${ACCESSIBLE_COLORS.tertiary.warning} ${Math.min(100, Math.max(0, v * 100))}%, transparent ${Math.min(100, Math.max(0, v * 100))}%)`,
                              border: `1px solid ${ACCESSIBLE_COLORS.tertiary.warning}`,
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                              paddingBottom: '2px'
                            }} 
                            title={`${noteNames[i]}: ${v.toFixed(3)}`}
                          >
                            <Typography variant="caption" sx={{ fontSize: '8px', color: 'rgba(245,245,245,0.9)' }}>
                              {noteNames[i]}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Real-time Metrics */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {typeof meydaData.rms === 'number' && (
                      <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)' }}>
                        RMS: {(meydaData.rms * 100).toFixed(1)}%
                      </Typography>
                    )}
                    {typeof meydaData.spectralCentroid === 'number' && (
                      <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)' }}>
                        Centroid: {Math.round(meydaData.spectralCentroid)} Hz
                      </Typography>
                    )}
                    {typeof meydaData.spectralRolloff === 'number' && (
                      <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)' }}>
                        Rolloff: {Math.round(meydaData.spectralRolloff)} Hz
                      </Typography>
                    )}
                    {typeof meydaData.zcr === 'number' && (
                      <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)' }}>
                        ZCR: {meydaData.zcr.toFixed(3)}
                      </Typography>
                    )}
                    {typeof meydaData.energy === 'number' && (
                      <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.78)' }}>
                        Energy: {meydaData.energy.toFixed(3)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

          </div>
        )}
        {tab === 'fx' && (
          <div style={{ padding: 12 }}>
            {/* FX Routing Toolbar - Radio Buttons */}
            <Box sx={{ marginBottom: '16px' }}>
              <ButtonGroup 
                variant="outlined" 
                aria-label="FX source selection"
                sx={{
                  width: '100%',
                  display: 'flex',
                  '& .MuiButton-root': {
                    flex: 1,
                    color: 'rgba(255,255,255,0.78)',
                    borderColor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      borderColor: ACCESSIBLE_COLORS.subdominant.primary,
                      backgroundColor: 'rgba(98, 245, 255, 0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: ACCESSIBLE_COLORS.subdominant.primary,
                      color: '#000',
                      borderColor: ACCESSIBLE_COLORS.subdominant.primary,
                      '&:hover': {
                        backgroundColor: ACCESSIBLE_COLORS.subdominant.primary,
                      },
                    },
                  },
                }}
              >
                <Button
                  variant={fxRadioValue === 'osc1' ? 'contained' : 'outlined'}
                  onClick={() => setFxRadioValue('osc1')}
                  aria-label="Select oscillator 1 source"
                  aria-pressed={fxRadioValue === 'osc1'}
                  sx={{
                    backgroundColor: fxRadioValue === 'osc1' ? ACCESSIBLE_COLORS.subdominant.primary : 'transparent',
                    color: fxRadioValue === 'osc1' ? '#000' : 'rgba(255,255,255,0.78)',
                  }}
                >
                  Synth
                </Button>
                <Button
                  variant={fxRadioValue === 'sampler' ? 'contained' : 'outlined'}
                  onClick={() => setFxRadioValue('sampler')}
                  aria-label="Select sampler source"
                  aria-pressed={fxRadioValue === 'sampler'}
                  sx={{
                    backgroundColor: fxRadioValue === 'sampler' ? ACCESSIBLE_COLORS.subdominant.primary : 'transparent',
                    color: fxRadioValue === 'sampler' ? '#000' : 'rgba(255,255,255,0.78)',
                  }}
                >
                  Sampler
                </Button>
                <Button
                  variant={fxRadioValue === 'stk1' ? 'contained' : 'outlined'}
                  onClick={() => setFxRadioValue('stk1')}
                  aria-label="Select STK source"
                  aria-pressed={fxRadioValue === 'stk1'}
                  sx={{
                    backgroundColor: fxRadioValue === 'stk1' ? ACCESSIBLE_COLORS.subdominant.primary : 'transparent',
                    color: fxRadioValue === 'stk1' ? '#000' : 'rgba(255,255,255,0.78)',
                  }}
                >
                  STK
                </Button>
                <Button
                  variant={fxRadioValue === 'audioin' ? 'contained' : 'outlined'}
                  onClick={() => setFxRadioValue('audioin')}
                  aria-label="Select audio input source"
                  aria-pressed={fxRadioValue === 'audioin'}
                  sx={{
                    backgroundColor: fxRadioValue === 'audioin' ? ACCESSIBLE_COLORS.subdominant.primary : 'transparent',
                    color: fxRadioValue === 'audioin' ? '#000' : 'rgba(255,255,255,0.78)',
                  }}
                >
                  AudioIn
                </Button>
              </ButtonGroup>
            </Box>

            {/* Conditional rendering based on fxRadioValue */}
            {fxRadioValue === 'audioin' && (
              <Box
                id='effect-dropdown-container'
                sx={{
                  pointerEvents: showAudioInDropdown ? 'auto' : 'none',
                  opacity: showAudioInDropdown ? 1 : 0.5,
                  marginBottom: '16px',
                }}
              >
                <EffectDropdown
                  chuckRef={chuckRefForEffect}
                  updateSelectedAudioInSetting={(e: any) => updateSelectedAudioInSetting(e)}
                  showAudioInDropdown={showAudioInDropdown}
                />
              </Box>
            )}

            {fxRadioValue === 'stk1' && (
              <>
                {/* STK Manager */}
                <Box sx={{ padding: '8px', backgroundColor: 'rgba(28,28,28,0.78)', marginBottom: '16px' }}>
                  <STKManagerDropdown 
                    updateStkKnobs={updateStkKnobs} 
                    stkValues={stkValues} 
                    setStkValues={setStkValues} 
                  />
                </Box>

                {/* FX Routing for STK */}
                <FXRouting
                  key={`fx_${fxRadioValue}` + fxRadioValue}
                  fxData={universalSourcesRef?.current?.[fxRadioValue]?.effects || {}}
                  width={440}
                  height={440}
                  updateCheckedFXList={handleUpdateCheckedFXList}
                  fxGroupsArrayList={[]}
                  checkedFXList={[]}
                  fxFX={[]}
                  handleClickName={handleClickName}
                  setClickFXChain={setClickFXChain}
                  clickFXChain={clickFXChain}
                  updateFXInputRadio={updateFXInputRadio}
                  fxRadioValue={fxRadioValue}
                  setStkValues={setStkValues}
                  stkValues={stkValues}
                  currentScreen={'synth'}
                  playUploadedFile={playUploadedFile}
                  lastFileUpload={lastFileUpload.current}
                  updateFileUploads={updateFileUploads}
                  handleCheckedFXToShow={handleCheckedFXToShow}
                  checkedEffectsListHook={checkedEffectsListHook}
                  setCheckedEffectsListHook={setCheckedEffectsListHook}
                />
              </>
            )}

            {(fxRadioValue === 'osc1' || fxRadioValue === 'sampler') && (
              <>
                {/* Available Effects List - shows all effects that can be added */}
                <Box sx={{ marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <Typography variant="caption" sx={{ color: ACCESSIBLE_COLORS.subdominant.primary, mb: 1, display: 'block', fontWeight: 600 }}>
                    Available Effects for {fxRadioValue === 'osc1' ? 'Synth' : 'Sampler'}
                  </Typography>
                  {universalSourcesRef?.current?.[fxRadioValue]?.effects ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '300px', overflowY: 'auto' }}>
                      {Object.entries(universalSourcesRef.current[fxRadioValue].effects).map(([fxKey, fx]: [string, any]) => (
                        <Box 
                          key={fxKey}
                          sx={{ 
                            padding: '8px', 
                            backgroundColor: fx?.On ? 'rgba(28, 169, 166, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${fx?.On ? ACCESSIBLE_COLORS.subdominant.primary : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: fx?.On ? 'rgba(28, 169, 166, 0.3)' : 'rgba(255,255,255,0.1)',
                            }
                          }}
                          onClick={() => {
                            // Toggle effect on/off
                            if (universalSourcesRef?.current?.[fxRadioValue]?.effects?.[fxKey]) {
                              universalSourcesRef.current[fxRadioValue].effects[fxKey].On = !fx?.On;
                              // Trigger re-render
                              handleUpdateCheckedFXList();
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ color: fx?.On ? ACCESSIBLE_COLORS.subdominant.primary : 'rgba(255,255,255,0.7)', fontWeight: fx?.On ? 600 : 400 }}>
                            {fx?.Type || fxKey} {fx?.On ? '✓ ON' : 'OFF'}
                          </Typography>
                          {fx?.VarName && (
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                              {fx.VarName}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontStyle: 'italic' }}>
                      Effects loading...
                    </Typography>
                  )}
                </Box>

                {/* FX Routing Component */}
                <Box sx={{ marginBottom: '16px', minHeight: '200px' }}>
                  <FXRouting
                    key={`fx_${fxRadioValue}` + fxRadioValue}
                    fxData={universalSourcesRef?.current?.[fxRadioValue]?.effects || {}}
                    width={440}
                    height={440}
                    updateCheckedFXList={handleUpdateCheckedFXList}
                    fxGroupsArrayList={[]}
                    checkedFXList={[]}
                    fxFX={[]}
                    handleClickName={handleClickName}
                    setClickFXChain={setClickFXChain}
                    clickFXChain={clickFXChain}
                    updateFXInputRadio={updateFXInputRadio}
                    fxRadioValue={fxRadioValue}
                    setStkValues={setStkValues}
                    stkValues={stkValues}
                    currentScreen={'synth'}
                    playUploadedFile={playUploadedFile}
                    lastFileUpload={lastFileUpload.current}
                    updateFileUploads={updateFileUploads}
                    handleCheckedFXToShow={handleCheckedFXToShow}
                    checkedEffectsListHook={checkedEffectsListHook}
                    setCheckedEffectsListHook={setCheckedEffectsListHook}
                  />
                </Box>
              </>
            )}

            {/* Pedalboard - shown for all sources except audioin */}
            {fxRadioValue !== 'audioin' && (
              <Box sx={{ marginTop: '16px' }}>
                <ReactDiagramsPedalboard
                  universalSources={universalSourcesRef}
                  currentChain={currentChain}
                  sourceName={fxRadioValue}
                  width={440}
                  height={200}
                  handleCheckedEffectsToShow={handleCheckedFXToShow}
                  getNewFX={getNewFX}
                />
              </Box>
            )}
          </div>
        )}
      </main>
    </aside>
    </>
  );
}

type OldParentMonolithProps = {
  runChuckCode: () => {};
  chuckHook: Chuck;
  selectedDeviceId: string;
  onUpload: (files: FileList | null) => Promise<void>;
  updateAudioInputDevice: (deviceId: string) => void; 
  deviceOptions: MediaDeviceInfo[];
  showAudioInDropdown: boolean;
  updateSelectedAudioInSetting: (deviceId: string) => void;
};

// Minimal shell reconstruction that preserves layout without changing engine internals
export default function OldParentMonolith(
  props: OldParentMonolithProps
) {
  const {
    runChuckCode,
    onUpload, 
    chuckHook, 
    selectedDeviceId, 
    updateAudioInputDevice, 
    deviceOptions,
    showAudioInDropdown,
    updateSelectedAudioInSetting 
  } = props;
  // Get Meyda audio analysis data - only if chuckHook is available
  const chuckHookRef = useRef(chuckHook);
  useEffect(() => {
    chuckHookRef.current = chuckHook;
  }, [chuckHook]);
  
  const { meydaData } = useAudioAnalysisAndMIDI(chuckHookRef as any, [chuckHook]);
  
  // App state (safe defaults)
  const clickedBegin = useOldMonolithStore(s => s.clickedBegin);
  const setClickedBegin = useOldMonolithStore(s => s.setClickedBegin);
  const [isChuckRunning, setIsChuckRunning] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsNumerator, setBeatsNumerator] = useState(4);
  const [beatsDenominator, setBeatsDenominator] = useState(4);
  const fxRadioValue = useOldMonolithStore(s => s.fxRadioValue);
  const setFxRadioValue = useOldMonolithStore(s => s.setFxRadioValue);
  const [fxKnobsCount, setFxKnobsCount] = useState(0);
  const [boxKey] = useState('initial');
  const controlView = useOldMonolithStore(s => s.controlView);
  const [audioKey, setAudioKey] = useState('C');
  const [showFX] = useState(true);
  const [hasHexKeys, setHasHexKeys] = useState(false);
  const isManagingEffects = useOldMonolithStore(s => s.isManagingEffects);

  // Knob/FX placeholders
  const [stkValues, setStkValues] = useState<any[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<any[]>([]);

  // Counters (transport/beat grid)
  const [currentBeatCountToDisplay] = useState(0);
  const [currentDenomCount] = useState(0);
  const [currentNumerCountColToDisplay] = useState(1);
  const [currentPatternCount] = useState(0);
  const [numeratorSignature] = useState(4);
  const [denominatorSignature] = useState(4);
  const [clockCounterKey] = useState('clock_0');

  // Shared refs
  const universalSourcesRef = universalSources as React.MutableRefObject<any>;
  const filesToProcessRef = filesToProcess as React.MutableRefObject<any>;
  const moogGrandmotherEffectsRef = moogGrandmotherEffects as React.MutableRefObject<any>;
  const uploadedBlobRef = uploadedBlob as React.MutableRefObject<any>;
  const globalChuckRef = chuckRef as React.MutableRefObject<any>;

  // Knob model (synth by default for shell)
  const { count: knobCount } = useKnobModel({
    mode: 'synth',
    fxRadioValue,
    moogGrandmotherEffectsRef,
    universalSourcesRef,
  });
  // if (fxKnobsCount !== knobCount) setFxKnobsCount(knobCount);
  useEffect(() => {
    if (fxKnobsCount !== knobCount) setFxKnobsCount(knobCount);
  }, [knobCount, fxKnobsCount]);
  // File uploads (button is disabled until chuckHook exists; still safe)
  const { onSubmit } = useFileUploads({
    chuck: undefined,
    filesToProcessRef,
  });

  // Derived chain for pedalboard visualization
  const currentChain = useMemo(() => {
    const chainObj = {
      osc1: [],
      stk1: [],
      sampler: [],
      audioin: [],
    } as any;
    try {
      const src = universalSourcesRef.current?.[fxRadioValue];
      const effects = src?.effects || {};
      chainObj[fxRadioValue] = Object.entries(effects)
        .filter(([, v]: any) => v && v.On)
        .map(([k]) => k);
    } catch {}
    return getChainForSource(chainObj, fxRadioValue);
  }, [fxRadioValue, universalSourcesRef.current]);

  // Handlers (no-ops for shell)
  const [isInitializingLocal, setIsInitializingLocal] = useState(false);

  const onStart = async () => {
    setIsInitializingLocal(true);
    try {
      // await runChuckCode();
    } catch (e) {
      console.error('runChuckCode failed:', e);
    } finally {
      setIsInitializingLocal(false);
      setClickedBegin(true);
    }
  };

  const updateKeyScaleChord = () => {};
  const handleUpdateSliderVal = () => {};
  const handleViewSTK = () => {};
  const handleViewEffect = () => {};
  const handleBackToSynth = () => {};

  // Left column stubs
  const handleChangeBeatsNumerator = (n: number) => setBeatsNumerator(n);
  const handleChangeBeatsDenominator = (n: number) => setBeatsDenominator(n);
  const setChuckUpdateNeeded = () => {};
  const handleUpdateCheckedFXList = () => {};
  const handleClickName = () => {};
  const [clickFXChain, setClickFXChain] = useState(false);
  const updateFXInputRadio = (e: any) => setFxRadioValue(e?.target?.value || 'osc1');
  const currentScreenCurrent = 'synth';
  const playUploadedFile = () => {};
  const lastFileUpload = useRef<any>(null);
  const updateFileUploads = () => {};
  const handleCheckedFXToShow = () => {};
  const [checkedEffectsListHook, setCheckedEffectsListHook] = useState<string[]>([]);

  // Pedalboard stubs
  const getNewFX = (_nm: string) => {};

  // Keyboard panel stubs
  const selectRef = useRef<any>(null);
  const tune = useRef<any>(null); // populated later when wiring microtonal
  // // Use globally-initialized ChucK instance exposed by ChuckSetup
  // const chuckHook = chuckRef as React.MutableRefObject<any>;
  const handleFXRadioChange = (e: any) => setFxRadioValue(e?.target?.value || 'osc1');
  const currentMicroTonalScale = (_: any) => {};
  const handleMingusKeyboardData = (_: any) => {};
  const handleMingusChordsData = (_: any) => {};
  const universalSourcesCurrent = universalSourcesRef.current;
  const handleUpdateVolumes = (_: string, __: number) => {};
  const handleUpdatePans = (_: string, __: number) => {};
  const handleToggleMutes = (_: string) => {};
  const handleToggleSolos = (_: string) => {};
  const [expandedMixerSource, setExpandedMixerSource] = useState('');
  const [keysVisible] = useState(true);
  const [keysReady] = useState(true);
  const [notesAddedDetails] = useState<any[]>([]);
  const organizeRows = async () => {};
  const organizeLocalStorageRows = async () => {};
  
  // Connect to HID keyboard manager if available
  useEffect(() => {
    const manager = (window as any).__keyboardHIDManager;
    if (manager) {
      const trigger = {
        noteOn: (midiNote: number, velocity: number, hz?: number) => {
          // Trigger note via existing system (will be implemented)
          console.log('HID noteOn:', midiNote, velocity, hz);
        },
        noteOff: (midiNote: number) => {
          console.log('HID noteOff:', midiNote);
        },
      };
      manager.registerTrigger(trigger);
      return () => {
        manager.unregisterTrigger(trigger);
      };
    }
  }, []);
  
  const noteOnPlay = (_m: number, _v: number) => {};
  const noteOffPlay = (_m: number) => {};
  const compare = (_a: any, _b: any) => 0;
  const [noteBuilderFocus] = useState('');
  const [mingusKeyboardData, setMingusKeyboardData] = useState<any>(null);
  const [mingusChordsData, setMingusChordsData] = useState<any>(null);
  // When Mingus-derived keyboard data arrives, infer EDO (steps per octave)
  useEffect(() => {
    try {
      if (mingusKeyboardData && mingusKeyboardData.data && Array.isArray(mingusKeyboardData.data[0])) {
        const scaleArr = mingusKeyboardData.data[0];
        const inferred = Math.max(2, Math.min(96, scaleArr.length || 12));
        // Update global microtonal store to reflect this EDO
        useMicrotonalStore.getState().setEdo(inferred);
      }
    } catch (e) {
      // ignore
    }
  }, [mingusKeyboardData]);
  const pressedNotesSet = useRef<Set<number>>(new Set());

  // Beat Grid placeholders
  const parentDivRef = useRef<HTMLDivElement | null>(null);
  const [featuresLegendData] = useState<any[]>([]);
  const [vizSource] = useState('osc1');
  const currentBeatSynthCount = {} as any;
  const handleOsc1RateUpdate = () => {};
  const handleMasterFastestRate = () => {};
  const handleStkRateUpdate = () => {};
  const handleSamplerRateUpdate = () => {};
  const handleAudioInRateUpdate = () => {};
  const currentNoteVals = {} as any;
  const editPattern = {} as any;
  const masterPatternsHashHook = useBeatGridStore((s) => s.masterPatternsHashHook);
  const masterPatternsHashHookUpdated = useBeatGridStore((s) => s.masterPatternsHashHookUpdated);
  const setMasterPatternsHashHook = useBeatGridStore((s) => s.setMasterPatternsHashHook);
  const inPatternEditMode = false as any;
  const currentSelectionsRef = useRef<{ x: number; y: number; subdivisions: number }>({ x: 0, y: 1, subdivision: 0 });

  // Initialize grid with default empty cells on mount
  useEffect(() => {
    const current = useBeatGridStore.getState().masterPatternsHashHook;
    // Only initialize if store is empty
    if (!current || Object.keys(current).length === 0) {
      const nCol = Number(numeratorSignature) * Number(denominatorSignature);
      const nRow = Number(denominatorSignature);
      const initialGrid: Record<string, Record<string, any>> = {};
      
      // Create default cells for each row/column
      for (let y = 1; y <= nRow; y++) {
        initialGrid[String(y)] = {};
        for (let x = 0; x < nCol; x++) {
          initialGrid[String(y)][String(x)] = {
            subdivisions: 1,
            velocity: 0.5,
            length: [1],
            fileNums: [],
            noteName: [],
            on: false
          };
        }
      }
      
      console.log('[OldParentMonolith] Initializing grid with', Object.keys(initialGrid).length, 'rows');
      setMasterPatternsHashHook(initialGrid);
    }
  }, [numeratorSignature, denominatorSignature, setMasterPatternsHashHook]);
  const selectFileForAssignment = () => {};
  const updateCellSubdivisions = useBeatGridStore((s) => s.updateCellSubdivisions);
  const handleChangeCellSubdivisions = useCallback((num: number, x: number, y: number) => {
    updateCellSubdivisions(num, x, y);
  }, [updateCellSubdivisions]);
  const cellSubdivisions = {} as any;
  const resetCellSubdivisionsCounter = () => {};
  const handleClickUploadedFiles = () => {};
  const clickHeatmapCell = (_x: number, _y: number, subdiv: number) => {
    let cS;
    currentSelectionsRef.current = {
      x: _x,
      y: _y,
      subdivision: subdiv,
    }
    cS = currentSelectionsRef.current;
    return cS; 
  };
  const updateCellFiles = useBeatGridStore((s) => s.updateCellFiles);
  const currentSelectedCell = useBeatGridStore((s) => s.currentSelectedCell);
  
  const handleLatestSamples = async (fileNames: string[], x: number, y: number) => {
    // Get all available files (preloaded + uploaded) to convert names to indices
    const preloadedFiles = [
      "DR-55Snare.wav",
      "DR-55Kick.wav", 
      "DR-55Hat.wav",
      "DR-55Pop.wav",
      "Conga.wav"
    ];
    const uploadedNames = filesToProcessRef.current ? (Array.isArray(filesToProcessRef.current) ? filesToProcessRef.current.map((f: any) => f?.filename || f?.name).filter(Boolean) : []) : [];
    const allAvailableFiles = Array.from(new Set([...preloadedFiles, ...uploadedNames]));
    
    // Convert file names to indices
    const fileIndices = fileNames
      .map((fileName: string) => allAvailableFiles.indexOf(fileName))
      .filter((idx: number) => idx !== -1);
    
    if (fileIndices.length === 0) {
      console.warn('[handleLatestSamples] No valid file indices found for:', fileNames);
      return;
    }
    
    // Get pattern options
    const patOptions = [0, 2, 4, 8, 16];
    const patternValue = patOptions[doAutoAssignPatternNumber] || 0;
    
    // Get grid dimensions
    const nCol = Number(numeratorSignature) * Number(denominatorSignature);
    const nRow = Number(denominatorSignature);
    
    // Determine which cells to assign to
    const cellsToAssign: Array<{ x: number; y: number }> = [];
    
    if (patternValue === 0) {
      // Just the current cell
      cellsToAssign.push({ x, y });
    } else {
      // Pattern-based: assign to all cells that match the pattern
      // Match the highlighting logic: ((16 * (y - 1) + x) - (16 * currentY + currentX)) % (16 / patternValue) === 0
      const startCellIndex = 16 * (y - 1) + x;
      const patternStep = 16 / patternValue;
      
      for (let row = 1; row <= nRow; row++) {
        for (let col = 0; col < nCol; col++) {
          const cellIndex = 16 * (row - 1) + col;
          const offset = cellIndex - startCellIndex;
          // Use modulo to handle wrapping, matching the highlighting logic
          if (offset % patternStep === 0) {
            cellsToAssign.push({ x: col, y: row });
          }
        }
      }
    }
    
    // Assign files to all highlighted cells
    console.log(`[handleLatestSamples] Assigning files to ${cellsToAssign.length} cells:`, cellsToAssign);
    cellsToAssign.forEach(({ x: cellX, y: cellY }) => {
      updateCellFiles(fileIndices, cellX, cellY);
    });
    
    // Bump grid version to trigger updates
    useBeatGridStore.getState().bumpGridVersion();
  };
  
  const updateCellNotes = useBeatGridStore((s) => s.updateCellNotes);
  const handleLatestNotes = async (notes: string[], x: number, y: number) => {
    // Get pattern options
    const patOptions = [0, 2, 4, 8, 16];
    const patternValue = patOptions[doAutoAssignPatternNumber] || 0;
    
    // Get grid dimensions
    const nCol = Number(numeratorSignature) * Number(denominatorSignature);
    const nRow = Number(denominatorSignature);
    
    // Determine which cells to assign to
    const cellsToAssign: Array<{ x: number; y: number }> = [];
    
    if (patternValue === 0) {
      // Just the current cell
      cellsToAssign.push({ x, y });
    } else {
      // Pattern-based: assign to all cells that match the pattern
      // Match the highlighting logic: ((16 * (y - 1) + x) - (16 * currentY + currentX)) % (16 / patternValue) === 0
      const startCellIndex = 16 * (y - 1) + x;
      const patternStep = 16 / patternValue;
      
      for (let row = 1; row <= nRow; row++) {
        for (let col = 0; col < nCol; col++) {
          const cellIndex = 16 * (row - 1) + col;
          const offset = cellIndex - startCellIndex;
          // Use modulo to handle wrapping, matching the highlighting logic
          if (offset % patternStep === 0) {
            cellsToAssign.push({ x: col, y: row });
          }
        }
      }
    }
    
    // Assign notes to all highlighted cells
    console.log(`[handleLatestNotes] Assigning notes to ${cellsToAssign.length} cells:`, cellsToAssign);
    cellsToAssign.forEach(({ x: cellX, y: cellY }) => {
      updateCellNotes(notes, cellX, cellY);
    });
    
    // Bump grid version to trigger updates
    useBeatGridStore.getState().bumpGridVersion();
  };
  const mTFreqs: number[] = [];
  const mTMidiNums: number[] = [];
  const updateKeyScaleChordBG = (...args: any[]) => updateKeyScaleChord(...args);
  const [doAutoAssignPatternNumber, setDoAutoAssignPatternNumber] = useState(0);
  const handleAssignPatternNumber = (e: any) => {
    const val = Number(e.target.value);
    setDoAutoAssignPatternNumber(val);
  };
  const currentMicroTonalScaleBG = (s: any) => {};
  const doUpdateBabylonKey = () => {};
  const [babylonKey] = useState('bg_0');
  const updateCurrentFXScreen = () => {};
  const getSTK1Preset = (_: string) => ({} as any);
  const updateMicroTonalScale = (_: any) => {};
  const updateMingusData = (_: any) => {};
  const handleChangeNotesAscending = (_: string) => {};
  const mTNames: string[] = [];
  const [noteBuilderFocusBG, setNoteBuilderFocusBG] = useState('');
  const handleNoteBuilder = (focus: string) => setNoteBuilderFocusBG(focus);
  const handleNoteLengthUpdate = (_e: any, _cellData: any, _newVal: any) => {};
  const handleNoteVelocityUpdate = (_e: any, _cellData: any) => {};
  // Original range restored - MIDI 0-127 allows wider range but keeping original working values
  const [octaveMax] = useState(4);
  const [octaveMin] = useState(1);
  const clickedFileRef = useRef<string | null>(null);
  const getMeydaData = async (_ab: ArrayBuffer) => ({});
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [showBeatGridOverlay, setShowBeatGridOverlay] = useState(false);

  // Compute grid params for beat grid
  const timeSig = useTransportStore(s => s.timeSig);
  const stepsPerBeat = useTransportStore(s => s.stepsPerBeat);
  const { 
    beatsPerMeasure: derivedBeatsPerMeasure, 
    stepsPerBeat: derivedStepsPerBeat, 
    stepsPerMeasure 
  } = deriveGridParams(timeSig.num, timeSig.den);

  // Layout
  return (
    <>
      {/* Launch Screen */}
        {!clickedBegin && (
          <OldLaunchScreen 
            onStart={onStart}
            isInitializing={isInitializingLocal}
          />
      )}

      {/* Transport Header */}
      {clickedBegin && (
        <>
          <OldTransportHeader
            chuckHook={chuckHook || undefined}
            isChuckRunning={isChuckRunning}
            currentPatternCount={currentPatternCount}
            currentDenomCount={currentDenomCount}
            currentNumerCountColToDisplay={currentNumerCountColToDisplay}
            currentBeatCountToDisplay={currentBeatCountToDisplay}
            numeratorSignature={numeratorSignature}
            clockCounterKey={clockCounterKey}
          />
          <MeydaHUD />
          <OldKeyboardPanel
            selectRef={selectRef}
            tune={tune.current}
            chuckHook={chuckHook.current}
            stkValues={stkValues}
            checkedEffectsListHook={checkedEffectsListHook}
            handleFXRadioChange={handleFXRadioChange}
            currentMicroTonalScale={currentMicroTonalScale}
            handleCheckedFXToShow={handleCheckedFXToShow}
            setStkValues={setStkValues}
            updateStkKnobs={() => {}}
            handleMingusKeyboardData={setMingusKeyboardData}
            handleMingusChordsData={setMingusChordsData}
            clickedBegin={clickedBegin}
            universalSourcesCurrent={universalSourcesCurrent}
            handleUpdateVolumes={handleUpdateVolumes}
            handleUpdatePans={handleUpdatePans}
            handleToggleMutes={handleToggleMutes}
            handleToggleSolos={handleToggleSolos}
            expandedMixerSource={expandedMixerSource}
            setExpandedMixerSource={setExpandedMixerSource}
            keysVisible={keysVisible}
            keysReady={keysReady}
            notesAddedDetails={notesAddedDetails}
            organizeRows={organizeRows as any}
            organizeLocalStorageRows={organizeLocalStorageRows as any}
            noteOnPlay={noteOnPlay}
            noteOffPlay={noteOffPlay}
            compare={compare}
            noteBuilderFocus={noteBuilderFocus}
            mingusKeyboardData={mingusKeyboardData}
            mingusChordsData={mingusChordsData}
            pressedNotesSet={pressedNotesSet.current}
          />
        </>
      )}




      {/* Live analysis HUD (Meyda + MIDI) */}
      <Box sx={{ pointerEvents: 'none', position: 'fixed', left: 16, bottom: 0, zIndex: 10050 }}>

      </Box>

      {/* Right Drawer with Grid, Timing Controls, etc. */}
      <RightDrawer
        isChuckRunning={isChuckRunning}
        featuresLegendData={featuresLegendData}
        universalSources={universalSourcesRef.current}
        vizSource={vizSource}
        currentBeatSynthCount={currentBeatSynthCount}
        handleOsc1RateUpdate={handleOsc1RateUpdate}
        handleMasterFastestRate={handleMasterFastestRate}
        handleStkRateUpdate={handleStkRateUpdate}
        handleSamplerRateUpdate={handleSamplerRateUpdate}
        handleAudioInRateUpdate={handleAudioInRateUpdate}
        currentNoteVals={currentNoteVals}
        filesToProcess={filesToProcessRef.current}
        beatsNumerator={beatsNumerator}
        beatsDenominator={beatsDenominator}
        editPattern={editPattern}
        masterPatternsHashHook={masterPatternsHashHook}
        masterPatternsHashHookUpdated={masterPatternsHashHookUpdated}
        inPatternEditMode={inPatternEditMode}
        selectFileForAssignment={selectFileForAssignment}
        handleChangeCellSubdivisions={handleChangeCellSubdivisions}
        cellSubdivisions={cellSubdivisions}
        resetCellSubdivisionsCounter={resetCellSubdivisionsCounter}
        handleClickUploadedFiles={handleClickUploadedFiles}
        parentDiv={parentDivRef.current}
        currentBeatCountToDisplay={currentBeatCountToDisplay}
        currentNumerCountColToDisplay={currentNumerCountColToDisplay}
        currentDenomCount={currentDenomCount}
        currentPatternCount={currentPatternCount}
        clickHeatmapCell={clickHeatmapCell}
        handleLatestSamples={handleLatestSamples}
        selectedDeviceId={selectedDeviceId}
        updateAudioInputDevice={updateAudioInputDevice}
        deviceOptions={deviceOptions}
        showAudioInDropdown={showAudioInDropdown}
        updateSelectedAudioInSetting={updateSelectedAudioInSetting}
        chuckHook={chuckHook}
        handleLatestNotes={handleLatestNotes}
        mTFreqs={mTFreqs}
        mTMidiNums={mTMidiNums}
        updateKeyScaleChordBG={updateKeyScaleChordBG}
        handleAssignPatternNumber={handleAssignPatternNumber}
        doAutoAssignPatternNumber={doAutoAssignPatternNumber}
        setStkValues={setStkValues}
        currentMicroTonalScaleBG={currentMicroTonalScaleBG}
        setFxKnobsCount={setFxKnobsCount}
        doUpdateBabylonKey={doUpdateBabylonKey}
        babylonKey={babylonKey}
        updateCurrentFXScreen={updateCurrentFXScreen}
        getSTK1Preset={getSTK1Preset}
        universalSourcesRef={universalSourcesRef}
        updateMicroTonalScale={updateMicroTonalScale}
        mingusKeyboardData={mingusKeyboardData}
        mingusChordsData={mingusChordsData}
        updateMingusData={updateMingusData}
        handleChangeNotesAscending={handleChangeNotesAscending}
        mTNames={mTNames}
        fxRadioValue={fxRadioValue}
        noteBuilderFocusBG={noteBuilderFocusBG}
        handleNoteBuilder={handleNoteBuilder}
        handleNoteLengthUpdate={handleNoteLengthUpdate}
        handleNoteVelocityUpdate={handleNoteVelocityUpdate}
        currentSelectedCell={currentSelectedCell}
        octaveMax={octaveMax}
        octaveMin={octaveMin}
        uploadedBlobRef={uploadedBlobRef}
        getMeydaData={getMeydaData}
        clickedFileRef={clickedFileRef}
        globalChuckRef={globalChuckRef}
        setDetectedBpm={setDetectedBpm}
      />

    </>
  );
}

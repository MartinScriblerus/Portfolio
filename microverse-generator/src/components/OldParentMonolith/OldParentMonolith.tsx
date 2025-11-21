// @ts-nocheck
"use client"

import { useTransportStore } from '../../store/useTransportStore';
import { computeGridConfig } from '../../utils/gridMath';
import { deriveGridParams } from '../../utils/siteHelpers';
import { WaveformCanvas } from '../WaveformCanvas';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';
import dynamic from 'next/dynamic';
import EffectDropdown from '../EffectsDropdown';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Select, Button } from '@mui/material';
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
import { Chuck } from 'webchuck';

  
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
  clickHeatmapCell: (x: number, y: number) => void;
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
};

// Editing Mode Toggle Component - Fixed to prevent re-renders
const EditingModeToggle = React.memo(() => {
  const isEditing = useBeatGridStore((s) => s.isEditing);
  const setIsEditing = useBeatGridStore((s) => s.setIsEditing);
  
  return (
    <Box sx={{ padding: '8px', borderTop: '1px solid #333', borderBottom: '1px solid #333' }}>
      <button
        onClick={() => setIsEditing(!isEditing)}
        style={{
          width: '100%',
          padding: '10px',
          background: isEditing ? 'rgba(98, 245, 255, 0.3)' : 'rgba(40, 40, 40, 0.8)',
          border: `2px solid ${isEditing ? '#62f5ff' : '#666'}`,
          borderRadius: '6px',
          color: '#e0e0e0',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
        }}
      >
        {isEditing ? '✓ Editing Mode ON' : '✗ Editing Mode OFF'}
      </button>
    </Box>
  );
});
EditingModeToggle.displayName = 'EditingModeToggle';

function RightDrawer(props: RightDrawerProps) {
  const [tab, setTab] = useState<'grid' | 'mixer' | 'fx'>('grid');
  const [open, setOpen] = useState(true);
  const latestTimeDomainRef = useRef<Float32Array | null>(null);

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
            position: 'fixed',
            right: 8,
            top: '10%',
            transform: 'translateY(-50%)',
            zIndex: 31,
            padding: '12px 16px',
            background: 'rgba(10,10,14,0.95)',
            border: '1px solid #444',
            borderRadius: 8,
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Grid Sequencer →
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
            }} onClick={() => { setOpen(true); setTab('grid'); }} aria-pressed={tab === 'grid'}>Grid</Button>
            <Button sx={{
              pointerEvents: 'auto',
              pointer: 'cursor',
              zIndex: 99999,
            }} onClick={() => { setOpen(true); setTab('mixer'); }} aria-pressed={tab === 'mixer'}>Mixer</Button>
            <Button sx={{
              pointerEvents: 'auto',
              pointer: 'cursor',
              zIndex: 99999,
            }} onClick={() => { setOpen(true); setTab('fx'); }} aria-pressed={tab === 'fx'}>FX</Button>
          </Box>
          <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
            <TimingControls />
          </Box>
          {/* isEditing Toggle - Fixed to use hook properly */}
          <EditingModeToggle />
          {/* <div style={{ marginTop: 8 }}> */}
           {props.fxRadioValue === "sample" && <WaveformCanvas
              getSamples={() => latestTimeDomainRef.current}
              height={56}
              color="#62f5ff"
            />}
          {/* </div> */}
        </header>

      <main style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {tab === 'grid' && (
          <div style={{ padding: 4, zIndex: 999999, minHeight: '100%' }}>
            <Box sx={{ mt: 2, minHeight: 400, border: '1px solid #333', backgroundColor: 'rgba(0,0,0,0.3)' }}>
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
        {tab === 'mixer' && <div style={{ padding: 12 }}>Mixer content…</div>}
        {tab === 'fx' && <div style={{ padding: 12 }}>FX content…</div>}
      </main>
    </aside>
    </>
  );
}

type OldParentMonolithProps = {
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
    onUpload, 
    chuckHook, 
    selectedDeviceId, 
    updateAudioInputDevice, 
    deviceOptions,
    showAudioInDropdown,
    updateSelectedAudioInSetting 
  } = props;
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
  const onStart = async () => {
    // try {
      setClickedBegin(true);
    
      // setIsChuckRunning(true);
    // } catch (e) {
    //   // keep UI responsive even if engine init is deferred
    //   setClickedBegin(true);
    //   setIsChuckRunning(true);
    // }
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
  const [keysVisible] = useState(false);
  const [keysReady] = useState(true);
  const [notesAddedDetails] = useState<any[]>([]);
  const organizeRows = async () => {};
  const organizeLocalStorageRows = async () => {};
  const noteOnPlay = (_m: number, _v: number) => {};
  const noteOffPlay = (_m: number) => {};
  const compare = (_a: any, _b: any) => 0;
  const [noteBuilderFocus] = useState('');
  const [mingusKeyboardData, setMingusKeyboardData] = useState<any>(null);
  const [mingusChordsData, setMingusChordsData] = useState<any>(null);
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
  const handleChangeCellSubdivisions = (num: number, x: number, y: number) => {
    updateCellSubdivisions(num, x, y);
  };
  const cellSubdivisions = {} as any;
  const resetCellSubdivisionsCounter = () => {};
  const handleClickUploadedFiles = () => {};
  const clickHeatmapCell = (_x: number, _y: number) => {};
  const handleLatestSamples = async () => {};
  const updateCellNotes = useBeatGridStore((s) => s.updateCellNotes);
  const handleLatestNotes = async (notes: string[], x: number, y: number) => {
    updateCellNotes(notes, x, y);
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
  const [currentSelectedCell] = useState({ x: 0, y: 0 });
  const [octaveMax] = useState(8);
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
          onStart={onStart} />
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
        </>
      )}

      {/* Right Column */}
      <Box sx={{ 
        position: 'fixed', 
        right: 0, 
        top: 0, 
        width: 240, 
        height: '100%', 
        zIndex: 30, 
        background: 'rgba(20,20,24,0.95)',
        overflowY: 'auto',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        pointerEvents: 'auto'
      }}>
        <Box sx={{ padding: '8px' }}>
          <Box className='select-device-id-wrapper' sx={{ marginBottom: '16px' }}>

                <Select
                    className='select-device-id-dropdown'
                    value={selectedDeviceId}
                    onChange={updateAudioInputDevice}
                    native
                    sx={{ 
                      cursor: 'pointer',
                      width: '100%',
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

            <Box
                id='effect-dropdown-container'
                sx={{
                    pointerEvents: showAudioInDropdown ? 'auto' : 'none',
                    opacity: showAudioInDropdown ? 1 : 0.5,
                }}
            >
                <EffectDropdown
                    chuckRef={chuckRef}
                    updateSelectedAudioInSetting={(e: any) => updateSelectedAudioInSetting(e)}
                    showAudioInDropdown={showAudioInDropdown}
                />
            </Box>
        </Box>
        <OldLeftColumn
          onUpload={onUpload} 
          onSubmit={onSubmit}
          chuckHook={chuckHook}
          FileUploadIcon={FileUploadIcon}
          showBPM={true}
          bpm={bpm}
          setBpm={setBpm}
          beatsNumerator={beatsNumerator}
          beatsDenominator={beatsDenominator}
          setChuckUpdateNeeded={setChuckUpdateNeeded}
          handleChangeBeatsNumerator={handleChangeBeatsNumerator}
          handleChangeBeatsDenominator={handleChangeBeatsDenominator}
          updateStkKnobs={() => {}}
          stkValues={stkValues}
          setStkValues={setStkValues}
          fXChainKey={`fx_${fxRadioValue}`}
          fxRadioValue={fxRadioValue}
          fxData={universalSourcesRef.current?.[fxRadioValue]?.effects || {}}
          handleUpdateCheckedFXList={handleUpdateCheckedFXList}
          fxGroupOptions={[]}
          checkedFXListCurrent={[]}
          handleClickName={handleClickName}
          setClickFXChain={setClickFXChain}
          clickFXChain={clickFXChain}
          updateFXInputRadio={updateFXInputRadio}
          currentScreenCurrent={'synth'}
          playUploadedFile={playUploadedFile}
          lastFileUpload={lastFileUpload.current}
          updateFileUploads={updateFileUploads}
          handleCheckedFXToShow={handleCheckedFXToShow}
          checkedEffectsListHook={checkedEffectsListHook}
          setCheckedEffectsListHook={setCheckedEffectsListHook}
        />
      </Box>

      {/* Middle/Knobs (pointer transparent) */}
      <Box 
      //sx={{ marginLeft: '140px', paddingTop: '56px', pointerEvents: 'none', position: 'relative', zIndex: 10 }} ref={parentDivRef}
      >
 


      </Box>

      {/* Pedalboard Preview */}
      {/* <Box sx={{ position: 'absolute', right: 16, top: 64 }}>
        <ReactDiagramsPedalboard
          universalSources={universalSourcesRef}
          currentChain={currentChain}
          sourceName={fxRadioValue}
          width={440}
          height={200}
          handleCheckedEffectsToShow={handleCheckedFXToShow}
          getNewFX={getNewFX}
        />
      </Box> */}

      {/* Keyboard + Mixer Panel */}
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

      {/* Live analysis HUD (Meyda + MIDI) */}
      <Box sx={{ pointerEvents: 'none', position: 'fixed', right: 16, top: 80, zIndex: 35 }}>
        <MeydaHUD />
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

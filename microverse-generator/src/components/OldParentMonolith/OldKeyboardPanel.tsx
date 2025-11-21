"use client";

import React from 'react';
import { Box, Button, ButtonGroup, Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import KeyboardControls from './OldKeyboardControls';
import AudioMixer from './OldAudioMixer';
import Keyboard from './OldKeyboard';
import HexKeyboard from '../HexKeyboard';
import { useOldMonolithStore } from '../../store/useOldMonolithStore';
import { useMicrotonalStore } from '../../store/useMicrotonalStore';
import { useCallback } from 'react';
import { filesToProcess as globalFilesToProcess, chuckRef as globalChuckRef } from '../../../app/state/refs';

type Props = {
  selectRef: any;
  tune: any;
  chuckHook: any;
  stkValues: any[];
  checkedEffectsListHook: string[];
  handleFXRadioChange: (e: any) => void;
  currentMicroTonalScale: (s: any) => void;
  handleCheckedFXToShow: (m: any) => void;
  setStkValues: (v: any[]) => void;
  updateStkKnobs: (v: any) => void;
  handleMingusKeyboardData: (d: any) => void;
  handleMingusChordsData: (d: any) => void;
  clickedBegin: boolean;
  universalSourcesCurrent: any;
  handleUpdateVolumes: (s: string, v: number) => void;
  handleUpdatePans: (s: string, v: number) => void;
  handleToggleMutes: (s: string) => void;
  handleToggleSolos: (s: string) => void;
  expandedMixerSource: string;
  setExpandedMixerSource: (s: string) => void;
  keysVisible: boolean;
  keysReady: boolean;
  notesAddedDetails: any[];
  organizeRows: (rowNum: number, note: string) => Promise<void>;
  organizeLocalStorageRows: (theNote: any) => Promise<void>;
  noteOnPlay: (midi: number, vel: number, hz?: any) => void;
  noteOffPlay: (midi: number) => void;
  compare: (a: any, b: any) => number;
  noteBuilderFocus: string;
  mingusKeyboardData: any;
  mingusChordsData: any;
  pressedNotesSet: Set<number>;
};

export default function OldKeyboardPanel(props: Props) {
  const {
    selectRef,
    tune,
    chuckHook,
    stkValues,
    checkedEffectsListHook,
    handleFXRadioChange,
    currentMicroTonalScale,
    handleCheckedFXToShow,
    setStkValues,
    updateStkKnobs,
    handleMingusKeyboardData,
    handleMingusChordsData,
    clickedBegin,
    universalSourcesCurrent,
    handleUpdateVolumes,
    handleUpdatePans,
    handleToggleMutes,
    handleToggleSolos,
    expandedMixerSource,
    setExpandedMixerSource,
    keysVisible,
    keysReady,
    notesAddedDetails,
    organizeRows,
    organizeLocalStorageRows,
    noteOnPlay,
    noteOffPlay,
    compare,
    noteBuilderFocus,
    mingusKeyboardData,
    mingusChordsData,
    pressedNotesSet,
  } = props;

  const keyboardMode = useOldMonolithStore(s => s.keyboardMode);
  const setKeyboardMode = useOldMonolithStore(s => s.setKeyboardMode);
  const sampleVoiceEnabled = useOldMonolithStore(s => s.sampleVoiceEnabled);
  const setSampleVoiceEnabled = useOldMonolithStore(s => s.setSampleVoiceEnabled);
  const sampleFileName = useOldMonolithStore(s => s.sampleFileName);
  const setSampleFileName = useOldMonolithStore(s => s.setSampleFileName);

  const stepsPerOctave = useMicrotonalStore(s => s.stepsPerOctave);
  const useSharps = useMicrotonalStore(s => s.useSharps);
  const baseMidi = useMicrotonalStore(s => s.baseMidi);
  const cents = useMicrotonalStore(s => s.cents);
  const showFraction = useMicrotonalStore(s => s.showFraction);


  console.log('keyboardMode???? ', keyboardMode);
  const getTunedHz = useCallback((midiNote: number, defaultHz?: number) => {
    const a4 = 440;
    // If cents provided, use them as the temperament for one octave cycle
    if (Array.isArray(cents) && cents.length > 0) {
      const cycle = cents.length;
      const stepsFromBase = midiNote - baseMidi;
      const octaves = Math.floor(stepsFromBase / cycle);
      const idxRaw = stepsFromBase % cycle;
      const idx = ((idxRaw % cycle) + cycle) % cycle;
      const fBase = a4 * Math.pow(2, (baseMidi - 69) / 12);
      const centsOffset = cents[idx] ?? 0;
      return fBase * Math.pow(2, octaves) * Math.pow(2, centsOffset / 1200);
    }
    // If standard 12-TET (no cents), use default or compute directly
    if (!stepsPerOctave || stepsPerOctave === 12) {
      return defaultHz ?? a4 * Math.pow(2, (midiNote - 69) / 12);
    }
    // Else use N-EDO proportional mapping from baseMidi
    const fBase = a4 * Math.pow(2, (baseMidi - 69) / 12);
    const stepsFromBase = Math.round((midiNote - baseMidi) * (stepsPerOctave / 12));
    return fBase * Math.pow(2, stepsFromBase / stepsPerOctave);
  }, [cents, stepsPerOctave, baseMidi]);

  // Derive uploaded file names (works if filesToProcess is a ref or an array)
  const getUploadedNames = () => {
    const src: any = (globalFilesToProcess as any);
    const arr = Array.isArray(src) ? src : (src && src.current ? src.current : []);
    try {
      return Array.from(new Set<string>((arr || []).map((f: any) => String(f.filename))));
    } catch {
      return [] as string[];
    }
  };
  const uploadedNames = getUploadedNames();

  const triggerSampleNoteOn = useCallback(async (hz: number, midiNote?: number) => {
    const chuck = (globalChuckRef as any)?.current;
    if (!chuck || !sampleVoiceEnabled || !sampleFileName || !hz) return;
    try {
      // UI-side contract: Provide selected sample name and target Hz for ChucK to act on.
      // TODO (ChucK): In your sampler code, listen for 'sampleNoteOn'/'sampleNoteOff' events.
      // Read 'samplerActiveFile' (string), 'samplerTargetHz' (float), and optional 'samplerMidiNote' (int).
      await chuck.setString('samplerActiveFile', sampleFileName);
      await chuck.setFloat('samplerTargetHz', hz);
      if (typeof midiNote === 'number') await chuck.setInt('samplerMidiNote', midiNote);
      await chuck.broadcastEvent('sampleNoteOn');
    } catch (e) {
      console.warn('Sample trigger failed', e);
    }
  }, [sampleVoiceEnabled, sampleFileName]);

  const triggerSampleNoteOff = useCallback(async (midiNote?: number) => {
    const chuck = (globalChuckRef as any)?.current;
    if (!chuck || !sampleVoiceEnabled || !sampleFileName) return;
    try {
      if (typeof midiNote === 'number') await chuck.setInt('samplerMidiNote', midiNote);
      await chuck.broadcastEvent('sampleNoteOff');
    } catch (e) {
      console.warn('Sample note off failed', e);
    }
  }, [sampleVoiceEnabled, sampleFileName]);

  const handleNoteOnWrapped = useCallback((midiNote: number, midiVelocity: number, midiHz?: number) => {
    const tuned = getTunedHz(midiNote, midiHz);
    if (sampleVoiceEnabled) {
      triggerSampleNoteOn(tuned || 0, midiNote);
    }
    // Pass through to original (synth, etc.)
    noteOnPlay && noteOnPlay(midiNote, midiVelocity, tuned);
  }, [getTunedHz, sampleVoiceEnabled, noteOnPlay, triggerSampleNoteOn]);

  const handleNoteOffWrapped = useCallback((midiNote: number) => {
    if (sampleVoiceEnabled) {
      triggerSampleNoteOff(midiNote);
    }
    noteOffPlay && noteOffPlay(midiNote);
  }, [sampleVoiceEnabled, noteOffPlay, triggerSampleNoteOff]);

  const getHexHz = useCallback((absStep: number, pitchIndex: number) => {
    const a4 = 440;
    const fBase = a4 * Math.pow(2, (baseMidi - 69) / 12);
    const oct = Math.floor(absStep / (stepsPerOctave || 12));
    if (Array.isArray(cents) && cents.length > 0) {
      const idx = ((pitchIndex % cents.length) + cents.length) % cents.length;
      const centsOffset = cents[idx] ?? 0;
      return fBase * Math.pow(2, oct) * Math.pow(2, centsOffset / 1200);
    }
    return fBase * Math.pow(2, absStep / (stepsPerOctave || 12));
  }, [cents, stepsPerOctave, baseMidi]);

  return (
    <Box
      sx={{
        // width: 'calc(100vw)',
        position: 'absolute',
        background: 'rgba(0,0,0,0.078 )',
        backgroundColor: 'rgba(0,0,0,0.078 )',
        bottom: '48px',
        left: '0px',
        padding: '8px',
        pointerEvents: keysVisible ? 'none' : 'auto',
        zIndex: 99999,
      }}
    >
      {/* Keyboard mode toggle + microtonal controls */}
      {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap', flexDirection: 'column' }}>
        <ButtonGroup sx={{ width: '100%', zIndex: 9999 }} size="small" color="primary" variant="outlined">
          <Button sx={{ zIndex: 99999, pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => setKeyboardMode('piano')} variant={keyboardMode === 'piano' ? 'contained' : 'outlined'}>Piano</Button>
          <Button sx={{ zIndex: 99999, pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => setKeyboardMode('hex')} variant={keyboardMode === 'hex' ? 'contained' : 'outlined'}>Hex</Button>
          <Button sx={{ zIndex: 99999, pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => setKeyboardMode('none')} variant={keyboardMode === 'none' ? 'contained' : 'outlined'}>None</Button>
        </ButtonGroup>

        <FormControlLabel
          control={<Switch checked={sampleVoiceEnabled} onChange={(e) => setSampleVoiceEnabled(e.target.checked)} size="small" />}
          label="Use Sample Voice"
        />

        <FormControl size="small" sx={{ minWidth: 180 }} disabled={!sampleVoiceEnabled || uploadedNames.length === 0}>
          <InputLabel id="sample-file-label">Sample File</InputLabel>
          <Select
            labelId="sample-file-label"
            label="Sample File"
            value={sampleFileName || ''}
            onChange={(e) => setSampleFileName(e.target.value || null)}
          >
            {uploadedNames.length === 0 && (
              <MenuItem value="" disabled>No uploads</MenuItem>
            )}
            {uploadedNames.map((nm) => (
              <MenuItem key={nm} value={nm}>{nm}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box> */}

      <KeyboardControls
        selectRef={selectRef}
        tune={tune}
        chuckHook={chuckHook}
        stkValues={stkValues}
        checkedEffectsListHook={checkedEffectsListHook}
        handleChange={handleFXRadioChange}
        currentMicroTonalScale={currentMicroTonalScale}
        handleCheckedFXToShow={handleCheckedFXToShow}
        setStkValues={setStkValues}
        updateStkKnobs={updateStkKnobs}
        handleMingusKeyboardData={handleMingusKeyboardData}
        handleMingusChordsData={handleMingusChordsData}
      />

      {clickedBegin && chuckHook && (
        <AudioMixer
          universalSources={universalSourcesCurrent}
          handleUpdateVolumes={handleUpdateVolumes}
          handleUpdatePans={handleUpdatePans}
          handleToggleMutes={handleToggleMutes}
          handleToggleSolos={handleToggleSolos}
          expandedMixerSource={expandedMixerSource}
          setExpandedMixerSource={setExpandedMixerSource}
        />
      )}

      {/* Render only one keyboard at a time, or none */}
      {keyboardMode === 'piano' ? (
        <Keyboard
          chuckHook={chuckHook}
          keysVisible={keysVisible}
          keysReady={keysReady}
          notesAddedDetails={notesAddedDetails}
          organizeRows={organizeRows}
          organizeLocalStorageRows={organizeLocalStorageRows}
          noteOnPlay={handleNoteOnWrapped}
          noteOffPlay={handleNoteOffWrapped}
          compare={compare}
          noteBuilderFocus={noteBuilderFocus}
          mingusKeyboardData={mingusKeyboardData}
          mingusChordsData={mingusChordsData}
          pressedNotes={pressedNotesSet}
          getTunedHz={getTunedHz}
        />
      ) : <></>}
    </Box>
  );
}

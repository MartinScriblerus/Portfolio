"use client";
import { create } from 'zustand';

export type SourceName = 'osc1' | 'stk1' | 'sampler' | 'audioin';
export type ControlView = 'knobsView' | 'controlsView';

interface OldMonolithState {
  // High-level session state
  clickedBegin: boolean;
  setClickedBegin: (v: boolean) => void;

  // Which source is active for FX and knobs
  fxRadioValue: SourceName;
  setFxRadioValue: (s: SourceName) => void;

  // Middle panel mode and FX management
  controlView: ControlView;
  setControlView: (v: ControlView) => void;
  isManagingEffects: boolean;
  setIsManagingEffects: (v: boolean) => void;

  // Keyboard rendering mode
  keyboardMode: 'piano' | 'hex' | 'none';
  setKeyboardMode: (m: 'piano' | 'hex' | 'none') => void;

  // Sample voice assignment
  sampleVoiceEnabled: boolean;
  setSampleVoiceEnabled: (v: boolean) => void;
  sampleFileName: string | null;
  setSampleFileName: (n: string | null) => void;
}

export const useOldMonolithStore = create<OldMonolithState>((set) => ({
  clickedBegin: false,
  setClickedBegin: (v) => set({ clickedBegin: v }),

  fxRadioValue: 'osc1',
  setFxRadioValue: (s) => set({ fxRadioValue: s }),

  controlView: 'knobsView',
  setControlView: (v) => set({ controlView: v }),
  isManagingEffects: false,
  setIsManagingEffects: (v) => set({ isManagingEffects: v }),

  keyboardMode: 'piano',
  setKeyboardMode: (m) => set({ keyboardMode: m }),

  sampleVoiceEnabled: false,
  setSampleVoiceEnabled: (v) => set({ sampleVoiceEnabled: v }),
  sampleFileName: null,
  setSampleFileName: (n) => set({ sampleFileName: n }),
}));

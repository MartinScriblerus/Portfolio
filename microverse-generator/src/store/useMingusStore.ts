'use client';

import { create } from 'zustand';

type MingusState = {
  keyboardData: any;
  chordsData: any;
  mTFreqs: number[];
  mTMidiNums: number[];
  mTNames: string[];
  
  // Actions
  setKeyboardData: (data: any) => void;
  setChordsData: (data: any) => void;
  setMTFreqs: (freqs: number[]) => void;
  setMTMidiNums: (nums: number[]) => void;
  setMTNames: (names: string[]) => void;
  updateMingusData: (type: 'keyboard' | 'chords', data: any) => void;
};

export const useMingusStore = create<MingusState>((set) => ({
  // Defaults
  keyboardData: null,
  chordsData: null,
  mTFreqs: [],
  mTMidiNums: [],
  mTNames: [],
  
  // Actions
  setKeyboardData: (data) => set({ keyboardData: data }),
  setChordsData: (data) => set({ chordsData: data }),
  setMTFreqs: (freqs) => set({ mTFreqs: freqs }),
  setMTMidiNums: (nums) => set({ mTMidiNums: nums }),
  setMTNames: (names) => set({ mTNames: names }),
  updateMingusData: (type, data) => {
    if (type === 'keyboard') {
      set({ keyboardData: data });
    } else if (type === 'chords') {
      set({ chordsData: data });
    }
  },
}));







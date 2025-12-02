'use client';

import { create } from 'zustand';

type FXState = {
  // FX selection
  fxRadioValue: string;
  fxKnobsCount: number;
  selectedEffects: any[];
  checkedEffectsList: string[];
  
  // STK
  stkValues: any[];
  
  // Actions
  setFxRadioValue: (value: string) => void;
  setFxKnobsCount: (count: number) => void;
  setSelectedEffects: (effects: any[]) => void;
  setCheckedEffectsList: (list: string[]) => void;
  setStkValues: (values: any[]) => void;
};

export const useFXStore = create<FXState>((set) => ({
  // Defaults
  fxRadioValue: 'osc1',
  fxKnobsCount: 0,
  selectedEffects: [],
  checkedEffectsList: [],
  stkValues: [],
  
  // Actions
  setFxRadioValue: (value) => set({ fxRadioValue: value }),
  setFxKnobsCount: (count) => set({ fxKnobsCount: count }),
  setSelectedEffects: (effects) => set({ selectedEffects: effects }),
  setCheckedEffectsList: (list) => set({ checkedEffectsList: list }),
  setStkValues: (values) => set({ stkValues: values }),
}));










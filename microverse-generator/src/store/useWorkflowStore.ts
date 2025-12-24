"use client";
import { create } from 'zustand';

/**
 * Workflow Mode: Determines how uploaded files and audio routing behave
 * 
 * - 'sampler': Files go to sampler (beatgrid), MIDI keyboard uses synth/osc
 * - 'midi-keyboard': Files go to shared buffers for MIDI keyboard, grid uses existing samples
 * - 'synth': Focus on synth/oscillator, files used for effects/processing only
 * - 'audioin': Focus on audio input processing, files used for effects/processing only
 * - 'hybrid': Files available for both sampler and MIDI keyboard (user chooses per-file)
 */
export type WorkflowMode = 'sampler' | 'midi-keyboard' | 'synth' | 'audioin' | 'hybrid';

interface WorkflowState {
  mode: WorkflowMode;
  setMode: (m: WorkflowMode) => void;
  
  // Buffer assignment tracking (which buffer is used for what)
  bufferAssignments: {
    [bufferIndex: number]: {
      source: 'file' | 'mic' | 'sampler' | 'synth' | null;
      fileName?: string;
      assignedAt: number;
    };
  };
  assignBuffer: (bufferIndex: number, source: WorkflowState['bufferAssignments'][number]['source'], fileName?: string) => void;
  clearBuffer: (bufferIndex: number) => void;
  
  // Auto-assign mode: automatically assign buffers or ask user
  autoAssign: boolean;
  setAutoAssign: (v: boolean) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  mode: 'hybrid', // Default to hybrid for flexibility
  setMode: (m) => {
    console.log(`[Workflow] Mode changed to: ${m}`);
    set({ mode: m });
  },
  
  bufferAssignments: {},
  assignBuffer: (bufferIndex, source, fileName) => {
    const assignments = { ...get().bufferAssignments };
    assignments[bufferIndex] = {
      source,
      fileName,
      assignedAt: Date.now(),
    };
    console.log(`[Workflow] Buffer ${bufferIndex} assigned to ${source}${fileName ? ` (${fileName})` : ''}`);
    set({ bufferAssignments: assignments });
  },
  clearBuffer: (bufferIndex) => {
    const assignments = { ...get().bufferAssignments };
    delete assignments[bufferIndex];
    set({ bufferAssignments: assignments });
  },
  
  autoAssign: false, // Default to manual (safer)
  setAutoAssign: (v) => set({ autoAssign: v }),
}));




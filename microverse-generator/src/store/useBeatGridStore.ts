'use client';

import { create } from 'zustand';
import { defaultNoteVals } from '../utils/helperDefaults';

type BeatGridState = {
  // Pattern data
  masterPatternsHashHook: Record<string, Record<string, any>>;
  masterPatternsHashHookUpdated: Record<string, number>;
  // Monotonic version to signal "grid fully updated" events to listeners
  gridVersion: number;
  
  // Note values
  currentNoteVals: any;
  
  // Selected cell
  currentSelectedCell: { x: number; y: number };
  noteBuilderFocus: string;
  isEditing: boolean;
  
  // Active cell (for tick-based updates without re-renders)
  activeCell: { x: number; y: number } | null;
  
  // File management
  clickedFile: string | null;
  // Timing / transport (merged from useTimingStore)
  bpm: number;
  setBpm: (bpm: number) => void;
  beatMs: number;
  setBeatMs: (beatMs: number) => void;
  // Subdivision (merged from useTimingSubdivision)
  subdivision: any;
  setSubdivision: (s: any) => void;
  // Tick state (merged from useTickStore)
  time: number;
  delta: number;
  setTick: (time: number, delta: number) => void;
  // Subdivision rate (fastest subdivisions per beat)
  masterFastestRate: number;
  setMasterFastestRate: (r: number) => void;
  rate: number; // legacy alias
  setRate: (r: number) => void;
  // Beats signature (numerator/denominator)
  beatsNumerator: number;
  beatsDenominator: number;
  lastBeatNumeratorUpdate: number;
  lastBeatDenominatorUpdate: number;
  setBeatsNumerator: (n: number) => void;
  setBeatsDenominator: (n: number) => void;
  incrementNumerator: () => void;
  decrementNumerator: () => void;
  incrementDenominator: () => void;
  decrementDenominator: () => void;
  
  // Actions
  setMasterPatternsHashHook: (patterns: Record<string, Record<string, any>>) => void;
  updateCellSubdivisions: (num: number, x: number, y: number) => void;
  updateCellNotes: (notes: string[], x: number, y: number) => void;
  updateCellFiles: (fileNums: number[], x: number, y: number) => void;
  markCellUpdated: (x: number, y: number) => void;
  bumpGridVersion: () => void;
  setCurrentNoteVals: (vals: any) => void;
  setCurrentSelectedCell: (cell: { x: number; y: number }) => void;
  setNoteBuilderFocus: (focus: string) => void;
  setClickedFile: (file: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  setActiveCell: (cell: { x: number; y: number } | null) => void;
  
  // Selectors for specific cell values to prevent unnecessary re-renders
  getCellValue: (x: number, y: number) => any;
};

export const useBeatGridStore = create<BeatGridState>((set, get) => ({
  // Defaults
  masterPatternsHashHook: {},
  masterPatternsHashHookUpdated: {},
  gridVersion: 0,
  currentNoteVals: defaultNoteVals,
  currentSelectedCell: { x: 0, y: 0 },
  noteBuilderFocus: '',
  clickedFile: null,
  isEditing: false,
  activeCell: null,
  // Timing defaults (merged)
  bpm: 120,
  setBpm: (bpm: number) => set({ bpm }),
  beatMs: 500,
  setBeatMs: (beatMs: number) => set({ beatMs }),
  subdivision: { unit: '1/16' },
  setSubdivision: (s: any) => set({ subdivision: s }),
  time: 0,
  delta: 0,
  setTick: (time: number, delta: number) => set({ time, delta }),
  // Beats signature (numerator/denominator) - centralized here so UI controls can be robust
  beatsNumerator: 4,
  beatsDenominator: 4,
  // Subdivision rate (fastest subdivisions per beat)
  // Internal timestamps to guard against rapid repeated updates (click flood/wheel spam)
  lastBeatNumeratorUpdate: 0,
  lastBeatDenominatorUpdate: 0,
  setBeatsNumerator: (n: number) => {
    const now = Date.now();
    const last = get().lastBeatNumeratorUpdate || 0;
    const cur = get().beatsNumerator;
    // avoid unnecessary updates when value is the same
    if (n === cur) return;
    // allow at most one update per 60ms to protect against UI spam
    if (now - last < 60) return;
    set({ beatsNumerator: n, lastBeatNumeratorUpdate: now });
    try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { beatsNumerator: n } })); } catch {}
    get().bumpGridVersion();
  },
  setBeatsDenominator: (n: number) => {
    const now = Date.now();
    const last = get().lastBeatDenominatorUpdate || 0;
    const cur = get().beatsDenominator;
    if (n === cur) return;
    if (now - last < 60) return;
    set({ beatsDenominator: n, lastBeatDenominatorUpdate: now });
    try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { beatsDenominator: n } })); } catch {}
    get().bumpGridVersion();
  },
  // canonical name for fastest subdivisions per beat (backwards-compatible with earlier prop names)
  masterFastestRate: 4,
  // Rate setter - powers-of-two friendly control for fastest subdivisions per beat
  setMasterFastestRate: (r: number) => {
    const val = Number(r) || 1;
    set({ masterFastestRate: val, rate: val });
    try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { masterFastestRate: val } })); } catch {}
    get().bumpGridVersion();
  },
  // legacy alias kept for compatibility
  rate: 16,
  setRate: (r: number) => {
    const val = Number(r) || 1;
    set({ rate: val, masterFastestRate: val });
    try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { rate: val } })); } catch {}
    get().bumpGridVersion();
  },
  // Guarded single-step helpers (call these for spinner arrow clicks)
  incrementNumerator: () => {
    const now = Date.now();
    const last = get().lastBeatNumeratorUpdate || 0;
    if (now - last < 60) return;
    const cur = get().beatsNumerator || 1;
    const next = Math.min(cur + 1, 16);
    set({ beatsNumerator: next, lastBeatNumeratorUpdate: now });
    try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { beatsNumerator: next } })); } catch {}
    get().bumpGridVersion();
  },
  decrementNumerator: () => {
    const now = Date.now();
    const last = get().lastBeatNumeratorUpdate || 0;
    if (now - last < 60) return;
    const cur = get().beatsNumerator || 1;
    const next = Math.max(cur - 1, 1);
    set({ beatsNumerator: next, lastBeatNumeratorUpdate: now });
    try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { beatsNumerator: next } })); } catch {}
    get().bumpGridVersion();
  },
  incrementDenominator: () => {
    const now = Date.now();
    const last = get().lastBeatDenominatorUpdate || 0;
    if (now - last < 60) return;
    const cur = get().beatsDenominator || 4;
    // common denominators only (1,2,4,8,16)
    const allowed = [1,2,4,8,16];
    const idx = allowed.indexOf(cur);
    const next = allowed[Math.min(allowed.length - 1, Math.max(0, idx + 1))];
    set({ beatsDenominator: next, lastBeatDenominatorUpdate: now });
    try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { beatsDenominator: next } })); } catch {}
    get().bumpGridVersion();
  },
  decrementDenominator: () => {
    const now = Date.now();
    const last = get().lastBeatDenominatorUpdate || 0;
    if (now - last < 60) return;
    const cur = get().beatsDenominator || 4;
    const allowed = [1,2,4,8,16];
    const idx = allowed.indexOf(cur);
    const next = allowed[Math.max(0, Math.min(allowed.length - 1, idx - 1))];
    set({ beatsDenominator: next, lastBeatDenominatorUpdate: now });
    try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { beatsDenominator: next } })); } catch {}
    get().bumpGridVersion();
  },
  
  // Actions
  setMasterPatternsHashHook: (patterns) => {
    // Replace entire grid and bump version to signal consumers
    console.log('[useBeatGridStore] setMasterPatternsHashHook called with:', patterns);
    console.log('[useBeatGridStore] Pattern keys (y-rows):', Object.keys(patterns || {}));
    set({ masterPatternsHashHook: patterns });
    set((s) => {
      const next = s.gridVersion + 1;
      // BLAMO -- right here! (global grid change)
      try { console.log("BLAMO -- right here!", { gridVersion: next }); } catch {}
      // Fire a global event so listeners (including components with chuckRef) can log immediately
      try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { gridVersion: next } })); } catch {}
      return { gridVersion: next };
    });
  },
  
  updateCellSubdivisions: (num, x, y) => {
    const DEBUG_STORE_LOGS = false;
    if (DEBUG_STORE_LOGS) console.log(`[useBeatGridStore] updateCellSubdivisions: cell[${x}, ${y}] = ${num}`);
    const state = get();
    const yKey = String(y);
    const xKey = String(x);
    
    // Check if value actually changed to avoid unnecessary updates
    const currentValue = state.masterPatternsHashHook?.[yKey]?.[xKey]?.subdivisions;
    if (currentValue === num) {
      return; // No change, skip update
    }
    
    set((state) => {
      // Only create new objects for the parts that changed
      const yRow = state.masterPatternsHashHook[yKey];
      const existingCell = yRow?.[xKey];
      
      // If cell exists and only subdivisions changed, reuse other properties
      if (existingCell && existingCell.subdivisions === currentValue) {
        const newCell = { ...existingCell, subdivisions: num };
        const newYRow = { ...yRow, [xKey]: newCell };
        const updated = { ...state.masterPatternsHashHook, [yKey]: newYRow };
        
        return {
          masterPatternsHashHook: updated,
          masterPatternsHashHookUpdated: {
            ...state.masterPatternsHashHookUpdated,
            [`${y}_${x}`]: Date.now()
          },
          // Bump version when a cell update occurs
          gridVersion: state.gridVersion + 1,
        };
      }
      
      // New cell or multiple properties changed - create new structure
      const updated = { ...state.masterPatternsHashHook };
      if (!updated[yKey]) {
        updated[yKey] = {};
      }
      updated[yKey] = { ...updated[yKey] };
      updated[yKey][xKey] = {
        ...(updated[yKey][xKey] || {}),
        subdivisions: num
      };
      
      return {
        masterPatternsHashHook: updated,
        masterPatternsHashHookUpdated: {
          ...state.masterPatternsHashHookUpdated,
          [`${y}_${x}`]: Date.now()
        },
        // Bump version when a cell update occurs
        gridVersion: state.gridVersion + 1,
      };
    });
    // Post-set side effects: emit logs and global event without relying on render timing
    try {
      const gv = get().gridVersion;
      // BLAMO -- right here! (cell-level grid change)
      if (DEBUG_STORE_LOGS) console.log("BLAMO -- right here!", { gridVersion: gv, cell: { x, y }, subdivisions: num });
      typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { gridVersion: gv, cell: { x, y } } }));
    } catch {}
  },
  
  updateCellNotes: (notes, x, y) => {
    const DEBUG_STORE_LOGS = false;
    if (DEBUG_STORE_LOGS) console.log(`[useBeatGridStore] updateCellNotes: cell[${x}, ${y}] =`, notes);
    const state = get();
    const yKey = String(y);
    const xKey = String(x);
    
    set((state) => {
      const updated = { ...state.masterPatternsHashHook };
      if (!updated[yKey]) {
        updated[yKey] = {};
      }
      updated[yKey] = { ...updated[yKey] };
      updated[yKey][xKey] = {
        ...(updated[yKey][xKey] || {}),
        noteName: notes
      };
      
      return {
        masterPatternsHashHook: updated,
        masterPatternsHashHookUpdated: {
          ...state.masterPatternsHashHookUpdated,
          [`${y}_${x}`]: Date.now()
        },
        gridVersion: state.gridVersion + 1,
      };
    });
    
    try {
      const gv = get().gridVersion;
      if (DEBUG_STORE_LOGS) console.log("BLAMO -- right here!", { gridVersion: gv, cell: { x, y }, notes });
      typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { gridVersion: gv, cell: { x, y } } }));
    } catch {}
  },
  
  updateCellFiles: (fileNums, x, y) => {
    const DEBUG_STORE_LOGS = false;
    if (DEBUG_STORE_LOGS) console.log(`[useBeatGridStore] updateCellFiles: cell[${x}, ${y}] =`, fileNums);
    const state = get();
    const yKey = String(y);
    const xKey = String(x);
    
    set((state) => {
      const updated = { ...state.masterPatternsHashHook };
      if (!updated[yKey]) {
        updated[yKey] = {};
      }
      updated[yKey] = { ...updated[yKey] };
      updated[yKey][xKey] = {
        ...(updated[yKey][xKey] || {}),
        fileNums: fileNums
      };
      
      return {
        masterPatternsHashHook: updated,
        masterPatternsHashHookUpdated: {
          ...state.masterPatternsHashHookUpdated,
          [`${y}_${x}`]: Date.now()
        },
        gridVersion: state.gridVersion + 1,
      };
    });
    
    try {
      const gv = get().gridVersion;
      if (DEBUG_STORE_LOGS) console.log("debug store logs(1): ", { gridVersion: gv, cell: { x, y }, fileNums });
      typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { gridVersion: gv, cell: { x, y } } }));
    } catch {}
  },
  
  // Selector to get specific cell value without subscribing to entire hash
  getCellValue: (x, y) => {
    const state = get();
    const yKey = String(y);
    const xKey = String(x);
    return state.masterPatternsHashHook?.[yKey]?.[xKey];
  },
  
  markCellUpdated: (x, y) => {
    set((state) => ({
      masterPatternsHashHookUpdated: {
        ...state.masterPatternsHashHookUpdated,
        [`${y}_${x}`]: Date.now()
      }
    }));
  },
  
  // Manual version bump in case other grid-shaping operations are added
  // NOTE (effects/STK): When reintegrating effects or STK that impact rhythm structure,
  // consider calling this to signal cache recomputation alongside grid changes.
  bumpGridVersion: () => set((s) => ({ gridVersion: s.gridVersion + 1 })),
  
  setCurrentNoteVals: (vals) => set({ currentNoteVals: vals }),
  setCurrentSelectedCell: (cell) => set({ currentSelectedCell: cell }),
  setNoteBuilderFocus: (focus) => set({ noteBuilderFocus: focus }),
  setClickedFile: (file) => set({ clickedFile: file }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  setActiveCell: (cell) => {
    try {
      const prev = get().activeCell;
      // Only dispatch event / log when value actually changed. Keep console logging gated behind
      // a runtime debug flag to avoid heavy console I/O on audio ticks.
      const changed = !prev || !cell || prev.x !== cell.x || prev.y !== cell.y;
      if (changed) {
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('beatgrid:activeCell', { detail: { activeCell: cell, ts: Date.now() } }));
          }
        } catch (e) {}
        if (typeof window !== 'undefined' && (window as any).__DEBUG_TICK) {
          console.log('[useBeatGridStore] setActiveCell:', { prev, next: cell, lastTick: (typeof window !== 'undefined' ? (window as any).__lastTick : undefined) });
        }
      }
    } catch (e) {
      // ignore logging errors
    }
    set({ activeCell: cell });
  },
}));

// Helper function to create a stable selector for a specific cell
// This prevents re-renders when other cells change
export const createCellSelector = (x: number, y: number) => {
  const yKey = String(y);
  const xKey = String(x);
  return (state: BeatGridState) => state.masterPatternsHashHook?.[yKey]?.[xKey];
};

// Deep equality check for cell data to prevent unnecessary re-renders
// Compares only the properties that matter for rendering
// Expose store to window for console debugging
if (typeof window !== 'undefined') {
  (window as any).__beatGridStore = useBeatGridStore;
  const DEBUG_STORE_LOGS = false;
  if (DEBUG_STORE_LOGS) {
    console.log('[useBeatGridStore] Store exposed to window.__beatGridStore');
    console.log('[useBeatGridStore] Usage: window.__beatGridStore.getState().masterPatternsHashHook');
  }
}

export const cellDataEquals = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  
  // Compare key properties that matter for rendering
  return (
    a.subdivisions === b.subdivisions &&
    a.velocity === b.velocity &&
    a.length === b.length &&
    JSON.stringify(a.fileNums) === JSON.stringify(b.fileNums) &&
    JSON.stringify(a.noteName) === JSON.stringify(b.noteName)
  );
};


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
  setActiveCell: (cell) => set({ activeCell: cell }),
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


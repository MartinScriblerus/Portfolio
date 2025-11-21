
// Helper function to create a stable selector for a specific cell
// This prevents re-renders when other cells change
export const createCellSelector = (x: number, y: number) => {
  const yKey = String(y);
  const xKey = String(x);
  return (state: BeatGridState) => state.masterPatternsHashHook?.[yKey]?.[xKey];
};

// Deep equality check for cell data to prevent unnecessary re-renders
// Compares only the properties that matter for rendering
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
'use client';

import { create } from 'zustand';
import { defaultNoteVals } from '../utils/helperDefaults';

type BeatGridState = {
  // Pattern data
  masterPatternsHashHook: Record<string, Record<string, any>>;
  masterPatternsHashHookUpdated: Record<string, number>;
  
  // Note values
  currentNoteVals: any;
  
  // Selected cell
  currentSelectedCell: { x: number; y: number };
  noteBuilderFocus: string;
  
  // File management
  clickedFile: string | null;
  
  // Actions
  setMasterPatternsHashHook: (patterns: Record<string, Record<string, any>>) => void;
  updateCellSubdivisions: (num: number, x: number, y: number) => void;
  markCellUpdated: (x: number, y: number) => void;
  setCurrentNoteVals: (vals: any) => void;
  setCurrentSelectedCell: (cell: { x: number; y: number }) => void;
  setNoteBuilderFocus: (focus: string) => void;
  setClickedFile: (file: string | null) => void;
};

export const useBeatGridStore = create<BeatGridState>((set, get) => ({
  // Defaults
  masterPatternsHashHook: {},
  masterPatternsHashHookUpdated: {},
  currentNoteVals: defaultNoteVals,
  currentSelectedCell: { x: 0, y: 0 },
  noteBuilderFocus: '',
  clickedFile: null,
  
  // Actions
  setMasterPatternsHashHook: (patterns) => set({ masterPatternsHashHook: patterns }),
  
  updateCellSubdivisions: (num, x, y) => {
    set((state) => {
      const updated = { ...state.masterPatternsHashHook };
      if (!updated[`${y}`]) {
        updated[`${y}`] = {};
      }
      if (!updated[`${y}`][`${x}`]) {
        updated[`${y}`][`${x}`] = {};
      }
      updated[`${y}`][`${x}`] = {
        ...updated[`${y}`][`${x}`],
        subdivisions: num
      };
      return {
        masterPatternsHashHook: updated,
        masterPatternsHashHookUpdated: {
          ...state.masterPatternsHashHookUpdated,
          [`${y}_${x}`]: Date.now()
        }
      };
    });
  },
  
  markCellUpdated: (x, y) => {
    set((state) => ({
      masterPatternsHashHookUpdated: {
        ...state.masterPatternsHashHookUpdated,
        [`${y}_${x}`]: Date.now()
      }
    }));
  },
  
  setCurrentNoteVals: (vals) => set({ currentNoteVals: vals }),
  setCurrentSelectedCell: (cell) => set({ currentSelectedCell: cell }),
  setNoteBuilderFocus: (focus) => set({ noteBuilderFocus: focus }),
  setClickedFile: (file) => set({ clickedFile: file }),
}));


  
  // Selectors for specific cell values to prevent unnecessary re-renders
  getCellValue: (x: number, y: number) => any;
    const state = get();
    const yKey = String(y);
    const xKey = String(x);
    
    // Check if value actually changed to avoid unnecessary updates
    const currentValue = state.masterPatternsHashHook?.[yKey]?.[xKey]?.subdivisions;
    if (currentValue === num) {
      return; // No change, skip update
    }
    
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
          }
        };
      }
      
      // New cell or multiple properties changed - create new structure
      if (!updated[yKey]) {
        updated[yKey] = {};
      }
      updated[yKey] = { ...updated[yKey] };
      updated[yKey][xKey] = {
        ...(updated[yKey][xKey] || {}),
      
  
  // Selector to get specific cell value without subscribing to entire hash
  getCellValue: (x, y) => {
    const state = get();
    const yKey = String(y);
    const xKey = String(x);
    return state.masterPatternsHashHook?.[yKey]?.[xKey];
  },

  // Monotonic version to signal "grid fully updated" events to listeners
  gridVersion: number;
  bumpGridVersion: () => void;
  gridVersion: 0,
  setMasterPatternsHashHook: (patterns) => {
    // Replace entire grid and bump version to signal consumers
    set({ masterPatternsHashHook: patterns });
    set((s) => ({ gridVersion: s.gridVersion + 1 }));
  },
          },
          // Bump version when a cell update occurs
          gridVersion: state.gridVersion + 1,
        },
        // Bump version when a cell update occurs
        gridVersion: state.gridVersion + 1,
  
  // Manual version bump in case other grid-shaping operations are added
  // NOTE (effects/STK): When reintegrating effects or STK that impact rhythm structure,
  // consider calling this to signal cache recomputation alongside grid changes.
  bumpGridVersion: () => set((s) => ({ gridVersion: s.gridVersion + 1 })),
    set((s) => {
      const next = s.gridVersion + 1;
      // BLAMO -- right here! (global grid change)
      try { console.log("BLAMO -- right here!", { gridVersion: next }); } catch {}
      // Fire a global event so listeners (including components with chuckRef) can log immediately
      try { typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { gridVersion: next } })); } catch {}
      return { gridVersion: next };
    });
    // Post-set side effects: emit logs and global event without relying on render timing
    try {
      const gv = get().gridVersion;
      // BLAMO -- right here! (cell-level grid change)
      console.log("BLAMO -- right here!", { gridVersion: gv, cell: { x, y }, subdivisions: num });
      typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { gridVersion: gv, cell: { x, y } } }));
    } catch {}
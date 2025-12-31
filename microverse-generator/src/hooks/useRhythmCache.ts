import { useEffect, useMemo, useRef } from 'react';
import { useBeatGridStore } from '../store/useBeatGridStore';
import { noteToFreq } from '../utils/utils';

// Types of the cache we build. Adapt as your DFS/next-event needs grow.
export type RhythmEvent = {
  y: number;                // row index
  x: number;                // col index
  subdivision: number;       // subdivision index within cell (0-based, default 0 if not divided)
  subdivisions: number;      // total subdivisions for this cell (default 1 if not divided)
  t: number;                // start time (beats or seconds depending on your convention)
  length: number;           // normalized length
  velocity: number;         // normalized velocity
  volume?: number;          // volume (separate from velocity)
  fileIdxs?: number[];      // optional sample indices
  fileNames?: string[];     // optional file names/paths (derived from fileIdxs if filesToProcess available)
  noteNames?: string[];     // optional note names
  noteFrequencies?: number[]; // optional note frequencies (calculated from noteNames)
  midiIn?: any;             // optional MIDI input events
  midiOut?: any;            // optional MIDI output events
};

export type RhythmCache = {
  version: number;          // mirrors gridVersion at build time
  events: RhythmEvent[];    // flattened DFS/sequence for quick traversal
  // Optionally include maps for "next event" lookups per (y,x)
  nextByCell: Record<string, RhythmEvent | undefined>;
  // Context/metadata for enhanced event processing
  context?: {
    mTFreqs?: number[];
    mTMidiNums?: number[];
    bpm?: number;
    numeratorSignature?: number;
    denominatorSignature?: number;
    notesHolder?: any;
    masterFastestRate?: number;
    selectedChordScaleOctaveRange?: any;
  };
};

/**
 * useRhythmCache
 * - Rebuilds a DFS/next-event cache when the gridVersion changes.
 * - Returns a stable ref to the cache for consumers to traverse without re-renders.
 *
 * NOTES:
 * - Effects/STK integration:
 *   When reintegrating effects/STK that influence timing or scheduling, you can:
 *   (1) Subscribe to their versions here and include them in the recompute condition.
 *   (2) Or call useBeatGridStore.getState().bumpGridVersion() from those systems
 *       to force a recompute using the same global trigger.
 * 
 * - Optional context:
 *   You can pass filesToProcess, tune, and other parameters for enhanced cache data.
 *   If not provided, cache will still work but without these enhancements.
 */
export function useRhythmCache(options?: {
  filesToProcess?: any[];  // Array of file objects with { filename, ... }
  tune?: any;               // Tune instance for frequency calculation
  mTFreqs?: number[];      // Microtonal frequencies array
  mTMidiNums?: number[];   // Microtonal MIDI numbers array
  selectedChordScaleOctaveRange?: any; // { key, scale, chord, octaveMin, octaveMax, freqs, notes, midi }
  bpm?: number;            // Beats per minute
  numeratorSignature?: number;  // Time signature numerator
  denominatorSignature?: number; // Time signature denominator
  notesHolder?: any;       // Ref/object holding current note values
  masterFastestRate?: number; // Fastest playback rate
}) {
  const gridVersion = useBeatGridStore((s) => s.gridVersion);
  const grid = useBeatGridStore((s) => s.masterPatternsHashHook);

  // NOTE (effects/STK): If effects/STK should also trigger recompute, either:
  // - add selectors here, e.g. const fxVersion = useFXStore(s => s.version);
  // - and include them in the dependency list below (gridVersion, fxVersion).
  // - OR call bumpGridVersion() in those change paths.

  const cacheRef = useRef<RhythmCache>({
    version: -1,
    events: [],
    nextByCell: {},
    context: undefined,
  });

  // Build cache whenever the version changes. We read the latest grid snapshot.
  useEffect(() => {
    const next = buildCacheFromGrid(grid, gridVersion, options);
    cacheRef.current = next;
  }, [
    gridVersion, 
    grid, 
    options?.filesToProcess, 
    options?.tune,
    options?.mTFreqs,
    options?.mTMidiNums,
    options?.bpm,
    options?.numeratorSignature,
    options?.denominatorSignature,
    options?.notesHolder,
    options?.masterFastestRate,
  ]);

  // Expose the cache and version as stable references
  return useMemo(
    () => ({
      cacheRef,
      version: cacheRef.current.version,
    }),
    [cacheRef.current.version]
  );
}

export function buildCacheFromGrid(
  grid: Record<string, Record<string, any>>,
  version: number,
  options?: {
    filesToProcess?: any[];
    tune?: any;
    mTFreqs?: number[];
    mTMidiNums?: number[];
    selectedChordScaleOctaveRange?: any;
    bpm?: number;
    numeratorSignature?: number;
    denominatorSignature?: number;
    notesHolder?: any;
    masterFastestRate?: number;
  }
): RhythmCache {
  const events: RhythmEvent[] = [];
  const nextByCell: Record<string, RhythmEvent | undefined> = {};
  const filesToProcess = options?.filesToProcess || [];
  const tune = options?.tune;

  // Helper: Calculate frequency from note name
  const getNoteFrequency = (noteName: string): number | null => {
    if (!noteName) return null;
    
    try {
      // Try parsing "C-4" format (note-octave)
      const match = String(noteName).match(/^([A-G][#b]?)-?(\d+)$/);
      if (match) {
        const [, note, octaveStr] = match;
        const octave = Number(octaveStr);
        return noteToFreq(note, octave);
      }
      
      // Try parsing microtonal format "degree/stepsPerOctave@octave"
      const microMatch = String(noteName).match(/^(\d+)\/(\d+)@(\d+)$/);
      if (microMatch && tune) {
        const [, degreeStr, stepsPerOctaveStr, octaveStr] = microMatch;
        const degree = Number(degreeStr);
        const octave = Number(octaveStr);
        try {
          (tune as any).mode.output = 'frequency';
          const freq = Number(tune.note(degree, octave));
          return Number.isFinite(freq) ? freq : null;
        } catch (e) {
          return null;
        }
      }
      
      // Fallback: try with Tune if available
      if (tune) {
        try {
          (tune as any).mode.output = 'frequency';
          // Try to extract octave from note name if possible
          const octaveMatch = noteName.match(/(\d+)/);
          const octave = octaveMatch ? Number(octaveMatch[1]) : 4;
          const noteOnly = noteName.replace(/[-\d]/g, '').trim();
          if (noteOnly) {
            return noteToFreq(noteOnly, octave);
          }
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (e) {
      // Ignore errors
    }
    
    return null;
  };

  // Helper: Get file names from file indices
  const getFileNames = (fileIdxs: number[] | undefined): string[] | undefined => {
    if (!fileIdxs || fileIdxs.length === 0 || filesToProcess.length === 0) {
      return undefined;
    }
    
    const names: string[] = [];
    for (const idx of fileIdxs) {
      if (idx >= 0 && idx < filesToProcess.length) {
        const file = filesToProcess[idx];
        const name = file?.filename || file?.name || String(idx);
        if (name) names.push(name);
      }
    }
    return names.length > 0 ? names : undefined;
  };

  // Traverse rows (y) then columns (x). Adjust ordering to your timing model.
  const yKeys = Object.keys(grid).sort((a, b) => Number(a) - Number(b));
  for (const yKey of yKeys) {
    const row = grid[yKey] || {};
    const xKeys = Object.keys(row).sort((a, b) => Number(a) - Number(b));
    for (const xKey of xKeys) {
      const cell = row[xKey] || {};
      const subdivisions = Number(cell.subdivisions ?? 1);
      const length = Number(cell.length ?? 1);
      const velocity = Number(cell.velocity ?? 0.5);
      const volume = cell.volume !== undefined ? Number(cell.volume) : undefined;
      const fileIdxs: number[] | undefined = cell.fileNums ? Array.from(cell.fileNums) : undefined;
      const noteNames: string[] | undefined = cell.noteName ? (Array.isArray(cell.noteName) ? cell.noteName : [cell.noteName]).filter(Boolean) : undefined;

      // Calculate file names and note frequencies
      const fileNames = getFileNames(fileIdxs);
      const noteFrequencies: number[] | undefined = noteNames 
        ? noteNames.map(getNoteFrequency).filter((f): f is number => f !== null)
        : undefined;

      // Create one event per subdivision (or one event if subdivisions = 0 or 1)
      const numSubdivisions = Math.max(1, subdivisions);
      for (let k = 0; k < numSubdivisions; k++) {
        const evt: RhythmEvent = {
          y: Number(yKey),
          x: Number(xKey),
          subdivision: k,                    // subdivision index (0-based)
          subdivisions: numSubdivisions,      // total subdivisions
          t: Number(xKey) + k / numSubdivisions,
          length,
          velocity,
          volume,
          fileIdxs,
          fileNames,
          noteNames,
          noteFrequencies,
          // MIDI events - placeholder for now (can be populated from cell.midiIn/midiOut if added to store)
          midiIn: cell.midiIn,
          midiOut: cell.midiOut,
        };
        events.push(evt);
      }
    }
  }

  // Sort by t (then by y/x/subdivision for deterministic ordering)
  events.sort((a, b) => (a.t - b.t) || (a.y - b.y) || (a.x - b.x) || (a.subdivision - b.subdivision));

  // Build a simple next-event lookup per cell (first next after t)
  // Key includes subdivision for granular lookup: "y_x_subdivision"
  for (let i = 0; i < events.length; i++) {
    const cur = events[i];
    const key = `${cur.y}_${cur.x}_${cur.subdivision}`;
    // First-next mapping: choose the next timeline event after current
    // This is a simple heuristic; extend as needed
    let nextEvt: RhythmEvent | undefined = undefined;
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].t >= cur.t) { nextEvt = events[j]; break; }
    }
    // Only set if not assigned to keep the earliest "next"
    if (nextByCell[key] === undefined) {
      nextByCell[key] = nextEvt;
    }
  }

  return {
    version,
    events,
    nextByCell,
    context: {
      mTFreqs: options?.mTFreqs,
      mTMidiNums: options?.mTMidiNums,
      bpm: options?.bpm,
      numeratorSignature: options?.numeratorSignature,
      denominatorSignature: options?.denominatorSignature,
      notesHolder: options?.notesHolder,
      masterFastestRate: options?.masterFastestRate,
      selectedChordScaleOctaveRange: options?.selectedChordScaleOctaveRange,
    },
  };
}










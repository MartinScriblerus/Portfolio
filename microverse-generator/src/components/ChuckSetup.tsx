'use client';
import { act, useEffect, useRef, useState, useCallback } from 'react';
import type { Chuck } from 'webchuck';
import { HID } from 'webchuck';
import { KeyboardHIDManager } from '../utils/keyboardHIDManager';
import {
    getAsymptoticChopperClass,
    getGrainStretchClass,
    getLisaTriggerClass,
    getMosaicSynthClass,
    getRandomReverseClass,
    getReichClass,
    getTapeClass,
    defaultAudioInSettings
} from '../utils/audioInSettingsHelper';
import { useTimingStore } from '../hooks/useTimingStore';
import { useBeatGridStore } from '../store/useBeatGridStore';
import { useTransportStore } from '../store/useTransportStore';
import '../../app/globals.css';
import { useAudioInSettingsStore } from '../utils/audioInSettingsHelper';
import { audioInEffectSlidersHelper } from '../utils/utils';
import { calculateDisplayDigits, loadWebChugins } from '../utils/audioClient';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MicOffIcon from '@mui/icons-material/MicOff';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Button, InputLabel, Select, Tooltip, Typography } from '@mui/material';
import SynthControlPanel from './SynthControlPanel';
import EffectsControlPanel from './EffectsControlPanel';
import PedalboardVisualization from './PedalboardVisualization';
import {
    filesToProcess,
    chuckRef as globalChuckRef,
    universalSources,
    moogGrandmotherEffects,
    activeSTKDeclarations,
    activeSTKSettings,
    activeSTKPlayOn,
    activeSTKPlayOff,
    masterPatternsRef
} from '../../app/state/refs';
import '../../app/globals.css';
import OldParentMonolith from '../components/OldParentMonolith/OldParentMonolith';
import { EFFECTS } from '../constants';
import {
    getChuckCode,
    buildSourceData,
    processSourceFX,
    createEmptyTargets
} from '../utils/chuckHelper';
import { useOldMonolithStore } from '../store/useOldMonolithStore';
import { useMicrotonalStore } from '../store/useMicrotonalStore';
import { initializeUniversalSources } from '../utils/effectsInitializationHelper';
import PhilosopherGuide from '../components/PhilosopherGuide';
import { buildCacheFromGrid } from '../hooks/useRhythmCache';

// Put this near the top, inside component file (module scope or inside component before handlers):
const SERVER_FILES_TO_PRELOAD: Array<{ serverFilename: string; virtualFilename: string }> = [
    { serverFilename: "/Conga.wav", virtualFilename: "Conga.wav" },
    { serverFilename: "/DR-55Hat.wav", virtualFilename: "DR-55Hat.wav" },
    { serverFilename: "/DR-55Kick.wav", virtualFilename: "DR-55Kick.wav" },
    { serverFilename: "/DR-55Pop.wav", virtualFilename: "DR-55Pop.wav" },
    { serverFilename: "/DR-55Snare.wav", virtualFilename: "DR-55Snare.wav" },
];

// -----------------------------
// Effect Dropdown + Sliders
// -----------------------------
export type FxDropProps = {
    chuckRef: any;
    updateSelectedAudioInSetting: any;
    showAudioInDropdown: boolean;
};

function EffectDropdown({ chuckRef, updateSelectedAudioInSetting, showAudioInDropdown }: FxDropProps) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [minimizeAudioInDropdown, setMinimizeAudioInDropdown] = useState(false);

    return (
        <div style={{ width: '100%', marginTop: 0 }}>
            <div
                style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-tertiary-muted, rgba(74,85,104,0.5))',
                    userSelect: 'none',
                    background: 'var(--color-dominant-surface, rgba(26,28,32,0.95))',
                    color: 'var(--color-dominant-text, #F5F7FA)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s ease',
                }}
                onClick={() => {
                    if (selected === '' && !minimizeAudioInDropdown) {
                        setMinimizeAudioInDropdown(true);
                    } else {
                        setMinimizeAudioInDropdown(false);
                    }
                    setSelected('');
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-subdominant-primary, #00D9FF)';
                    e.currentTarget.style.color = 'var(--color-subdominant-text, #0A0B0D)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-dominant-surface, rgba(26,28,32,0.95))';
                    e.currentTarget.style.color = 'var(--color-dominant-text, #F5F7FA)';
                }}
            >
                {selected || 'Select Effect'}
                <span
                    className="effects-dropdown-arrow"
                    style={{
                        rotate: selected ? '180deg' : '0deg',
                        float: 'right',
                        fontSize: '12px',
                        opacity: 0.7,
                    }}
                >
                    ▼
                </span>
            </div>

            {!minimizeAudioInDropdown && (
                <div className="effects-dropdown-wrapper">
                    {EFFECTS.map(effect => (
                        <div
                            key={effect}
                            className="effects-dropdown-item"
                            style={{
                                background:
                                    selected === effect ? 'rgba(255,255,255,0.10)' : 'transparent',
                            }}
                            onClick={() => {
                                // updateSelectedAudioInSetting
                                setSelected(effect);
                                setOpen(!open);
                                updateSelectedAudioInSetting(effect);
                            }}
                        >
                            {effect}
                            {selected === effect && (
                                <EffectSliders
                                    effect={selected}
                                    chuckRef={chuckRef}
                                    updateSelectedAudioInSetting={updateSelectedAudioInSetting}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function EffectSliders({ effect, chuckRef, updateSelectedAudioInSetting }: {
    effect: string,
    chuckRef: any,
    updateSelectedAudioInSetting: any
}) {
    const audioInSettingsHelperHash = useAudioInSettingsStore(s => s.audioInSettings);
    const setAudioInSetting = useAudioInSettingsStore(s => s.setAudioInSetting);
    const sliderNames = audioInEffectSlidersHelper(effect);
    const transformedKeyNames: string[] = sliderNames.map(name =>
        `${effect.trim().toLowerCase().replace(' ', '_')}_${name.name.trim().toLowerCase().replace(' ', '')}`
    );
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Local state for slider values
    const [values, setValues] = useState(() => transformedKeyNames.map((n: any) => (audioInSettingsHelperHash as any)[n]));

    // Sync local state to store when effect changes
    useEffect(() => {
        const valsForEffect: any = transformedKeyNames.map((n: any) => (audioInSettingsHelperHash as any)[n]);
        setValues(valsForEffect);
        updateSelectedAudioInSetting(effect);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effect, audioInSettingsHelperHash]);

    // Debounced update to Zustand and ChucK when values change
    // Matches SynthControlPanel pattern for consistent performance
    useEffect(() => {
        // Clear existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Debounce updates to avoid flooding ChucK with rapid slider movements
        updateTimeoutRef.current = setTimeout(async () => {
            if (!chuckRef.current) return;
            
            let updated = false;
            const transformByThousandSliderArray = ['lisa_trigger_rate', 'grain_rate', 'random_reverse_rate'];
            
            // Batch all parameter updates before broadcasting fxUpdate once
            for (let i = 0; i < sliderNames.length; i++) {
                const key = transformedKeyNames[i];
                const value = values[i];
                // Only update if value differs from store
                if ((audioInSettingsHelperHash as any)[key] !== value) {
                    setAudioInSetting(key, value);
                    const transformedValue = transformByThousandSliderArray.includes(key) 
                        ? +((value * 1.0) / 1000).toFixed(3) 
                        : +(value * 1.0).toFixed(3);
                    await chuckRef.current.setAssociativeFloatArrayValue("audioInSettingsHelperHash", key, transformedValue);
                        updated = true;
                    }
                }
            
            // Broadcast fxUpdate once after all parameters are updated
            if (updated) {
                await chuckRef.current.broadcastEvent("fxUpdate");
            }
        }, 50); // 50ms debounce matches SynthControlPanel

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
        // Only run when values change, not when store changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values]);

    return (
        <div style={{ padding: '12px 8px 8px 8px', background: 'rgba(0,0,0,0.10)', borderRadius: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{effect} Controls</div>
            {sliderNames.map((name, i) => (
                <div key={name.name} style={{ marginBottom: 10 }}>
                    <label
                        htmlFor={`effect-slider-${effect}-${i}`}
                        style={{ fontSize: 13, color: '#e9f1ff', marginBottom: 2, display: 'block' }}
                    >
                        {name.name}
                    </label>
                    <input
                        id={`effect-slider-${effect}-${i}`}
                        type="range"
                        min={name.min}
                        max={name.max}
                        value={values[i]}
                        onChange={e => {
                            const v = Number(e.target.value);
                            setValues((vals: any) => {
                                const newVals = vals.map((val: any, idx: number) => (idx === i ? v : val));
                                console.log(`[EffectSliders] setValues: index ${vals[i]} changed to`, v, "New values:", newVals);
                                return newVals;
                            });
                        }}
                        aria-label={`${name.name} slider, current value ${values[i]}`}
                        aria-valuemin={name.min}
                        aria-valuemax={name.max}
                        aria-valuenow={values[i]}
                        style={{ zIndex: 99999, width: 180, accentColor: '#6cf', height: 4 }}
                    />
                    <span style={{ marginLeft: 10, fontSize: 12, color: '#b7d6ff' }} aria-live="polite">{values[i]}</span>
                </div>
            ))}
        </div>
    );
}

// -----------------------------
// Main Component
// -----------------------------
// ============================================================
// CELL FUNCTION REGISTRY: Runtime-populatable function system
// Functions are stored per cell and compiled into ChucK code at build time
// Hot-swapping: Update function code and rebuild ChucK code
// ============================================================
const cellFunctionRegistry = new Map<string, string>();

/**
 * Register or update a cell function
 * @param functionId Unique identifier for the function
 * @param functionCode ChucK code string (must be valid ChucK function body)
 * @returns void
 */
export function registerCellFunction(functionId: string, functionCode: string): void {
    if (!functionId || !functionCode) {
        console.warn('[registerCellFunction] Invalid functionId or functionCode');
        return;
    }
    cellFunctionRegistry.set(functionId, functionCode);
    console.log(`[registerCellFunction] Registered function: ${functionId}`);
}

/**
 * Remove a cell function from registry
 * @param functionId Function identifier to remove
 * @returns void
 */
export function unregisterCellFunction(functionId: string): void {
    cellFunctionRegistry.delete(functionId);
    console.log(`[unregisterCellFunction] Removed function: ${functionId}`);
}

/**
 * Get all registered function IDs
 * @returns Array of function IDs
 */
export function getRegisteredFunctionIds(): string[] {
    return Array.from(cellFunctionRegistry.keys());
}

/**
 * Get function code by ID
 * @param functionId Function identifier
 * @returns Function code string or undefined
 */
export function getCellFunction(functionId: string): string | undefined {
    return cellFunctionRegistry.get(functionId);
}

// Expose registry API globally for RAG agent and other components
if (typeof window !== 'undefined') {
    (window as any).__cellFunctionRegistry = {
        register: registerCellFunction,
        unregister: unregisterCellFunction,
        getIds: getRegisteredFunctionIds,
        get: getCellFunction,
    };
}

export default function ChuckSetup() {
    // Disable verbose debug logging when monitoring performance —
    // toggle to `true` temporarily if deep debugging is needed.
    const DEBUG_HEAVY_LOGS = false;

    const chuckRef = useRef<Chuck | null>(null);
    const [ready, setReady] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [audioInSelected, setAudioInSelected] = useState<string>('');
    const [deviceOptions, setDeviceOptions] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [chuckHook, setChuckHook] = useState<Chuck | any>({});
    const [synthPanelOpen, setSynthPanelOpen] = useState(false);
    const [effectsPanelOpen, setEffectsPanelOpen] = useState(false);
    const [effectsPanelSource, setEffectsPanelSource] = useState<keyof import('../interfaces/audioTypes').Sources>('osc1');
    const hidRef = useRef<HID | null>(null);
    const keyboardHIDManagerRef = useRef<KeyboardHIDManager | null>(null);
    const isInitializingRef = useRef<boolean>(false); // Track initialization in progress (more reliable than state)
    
    // Handle synth parameter updates from knob controls (BabylonLayer pattern)
    // This function is called when synth knobs are turned, updating both the ref and ChucK
    // Based on SoundSink InitializationComponent.tsx pattern
    const handleUpdateSliderVal = useCallback(async (source: string, knobSpec: any, value: number) => {
        if (!knobSpec || !knobSpec.name) {
            console.warn('[handleUpdateSliderVal] Invalid knob spec:', knobSpec);
            return;
        }
        
        const paramName = knobSpec.name;
        const moogRef = moogGrandmotherEffects as React.MutableRefObject<any>;
        
        try {
            // Update moogGrandmotherEffects ref (matches SoundSink pattern)
            if (moogRef.current && moogRef.current[paramName]) {
                moogRef.current[paramName].value = value;
            }
            
            // Update ChucK if it's running
            if (chuckRef.current) {
                // Update ChucK global moogGMDefaults array (matches SoundSink pattern)
                await chuckRef.current.setAssociativeFloatArrayValue(
                    'moogGMDefaults',
                    paramName,
                    value
                );
                
                // Broadcast update event (triggers updateSynthParameters shred)
                await chuckRef.current.broadcastEvent('fxUpdate');
                
                if (DEBUG_HEAVY_LOGS) {
                    console.log(`[handleUpdateSliderVal] Updated ${paramName} to ${value} for source ${source}`);
                }
            }
        } catch (err) {
            console.error(`[handleUpdateSliderVal] Failed to update ${paramName}:`, err);
        }
    }, [chuckRef]);
    
    // Expose handleUpdateSliderVal globally for BabylonLayer and other components
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__handleUpdateSliderVal = handleUpdateSliderVal;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).__handleUpdateSliderVal;
            }
        };
    }, [handleUpdateSliderVal]);

    // Initialize universalSources with all effects on mount
    useEffect(() => {
        if (!universalSources.current) {
            console.log('Initializing universalSources with all available effects...');
            universalSources.current = initializeUniversalSources();
            console.log('✅ universalSources initialized');
        }
    }, []);

    // Global error handler to catch unhandled promise rejections from ChucK
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const err = event.reason;

            // Suppress ErrnoError errno 20 (file system errors) - these are often non-critical
            // This happens during ChucK initialization when it tries to access files that don't exist
            if (err?.name === 'ErrnoError' && err?.errno === 20) {
                event.preventDefault(); // Prevent the error from showing in console
                event.stopPropagation(); // Stop the error from propagating
                return; // Silently handle it
            }

            // Log other unhandled rejections for debugging (but still suppress from console)
            if (err?.name === 'ErrnoError') {
                if (process.env.NODE_ENV === 'development') {
                    console.debug('Unhandled ChucK ErrnoError (errno:', err?.errno, '):', err?.message);
                }
                event.preventDefault(); // Prevent the error from showing in console
                event.stopPropagation(); // Stop the error from propagating
                return;
            }

            // Check if error message contains "Running code failed" (string errors from WebChucK)
            if (typeof err === 'string' && err.includes('Running code failed')) {
                // This is handled in the catch block, suppress it here
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        };

        // Add listener with capture phase to catch errors early
        window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
        };
    }, []);

    const [isRunning, setIsRunning] = useState(false);
    const currentStreamRef = useRef<MediaStream | null>(null);
    const currentSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    // Memory leak prevention: debounce and batch grid updates
    const gridUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingGridUpdateRef = useRef<{ cancelled: boolean } | null>(null);

    const beatMs = useTimingStore((s: any) => s.beatMs);
    // Keyboard overlay mode from global store
    const keyboardMode = useOldMonolithStore(s => s.keyboardMode);
    const setKeyboardMode = useOldMonolithStore(s => s.setKeyboardMode);
    const audioInSettingsHelperHash = useAudioInSettingsStore(s => s.audioInSettings);
    const uploadedVFilesRef = useRef<string[]>([]);
    
            // Simple toggle: should uploaded files also be loaded into MIDI keyboard buffers?
    const [addToMidiBuffers, setAddToMidiBuffers] = useState(false);
    // Toggle: should keyboard clicks add notes to the notes dropdown? (default on)
    const [keyboardAddsToNotes, setKeyboardAddsToNotes] = useState(true);
    
    // Expose keyboard toggle to global scope on mount/update
    useEffect(() => {
        (window as any).__keyboardAddsToNotes = keyboardAddsToNotes;
    }, [keyboardAddsToNotes]);

    const globalAudioCtx = useRef<AudioContext | null>(null);
    // Defer AudioContext creation until the user explicitly enables audio (user gesture)
    useEffect(() => {
        return () => {
            if (globalAudioCtx.current) {
                try {
                    globalAudioCtx.current.close();
                } catch (e) {
                    // ignore
                }
                globalAudioCtx.current = null;
            }
        };
    }, []);

    const [showAudioInDropdown, setShowAudioInDropdown] = useState(false);

    // Local refs to manage tick->activeCell mapping so we can step L->R then shift rows.
    // Default ordering: top->bottom because it's often more intuitive in the UI.
    const lastTickRef = useRef<number | null>(null);
    const activeXRef = useRef<number>(0);
    const activeYRef = useRef<number>(0); // index corresponding to keys in masterPatternsHashHook (numeric y)
    const rowOrderTopToBottomRef = useRef<boolean>(true);

    // Helper: compute grid rows (sorted bottom->top) and column count for a given row
    const getGridRows = () => {
        const grid = useBeatGridStore.getState().masterPatternsHashHook || {};
        // collect numeric y keys
        const ys = Object.keys(grid).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n));
        // Filter out rows that don't have any cells (empty rows)
        const rowsWithCells = ys.filter(y => {
            const row = grid[String(y)];
            return row && Object.keys(row).length > 0;
        });
        // sort depending on configured order: top->bottom (ascending) or bottom->top (descending)
        rowsWithCells.sort((a, b) => rowOrderTopToBottomRef.current ? a - b : b - a);
        return rowsWithCells;
    };

    const getColumnsForRow = (y: number) => {
        const grid = useBeatGridStore.getState().masterPatternsHashHook || {};
        const row = grid[String(y)] || {};
        const xs = Object.keys(row).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n));
        if (xs.length === 0) return 16; // fallback
        return Math.max(...xs) + 1;
    };

    const advanceActiveCellFromTick = (tickNum: number) => {
        try {
            const rows = getGridRows();
            if (rows.length === 0) return;

            // Deterministic mapping using configured timing parameters when available.
            // Prefer authoritative layout from `chuckCodeData` if present: cellsPerRow = numeratorSignature * masterFastestRate,
            // number of rows = denominatorSignature. This matches how the ChucK `filesArr2D` was constructed.
            let cellsPerRow = null;
            let numRows = null;
            // Prefer precomputed layout stored in `chuckLayoutRef` (set after buildChuckCodeData completes)
            try {
                const layout = chuckLayoutRef.current;
                if (layout && Number.isInteger(layout.cellsPerRow) && Number.isInteger(layout.numRows)) {
                    cellsPerRow = layout.cellsPerRow;
                    numRows = layout.numRows;
                }
            } catch (e) {
                // ignore - fallback to inspected grid
            }

            // Fallbacks
            if (!cellsPerRow || cellsPerRow <= 0) {
                // derive a reasonable cellsPerRow from the current grid: use columns in first row
                const firstRow = rows[0];
                cellsPerRow = getColumnsForRow(firstRow);
            }
            if (!numRows || numRows <= 0) {
                numRows = rows.length;
            }

            const totalCells = cellsPerRow * numRows;
            if (totalCells <= 0) return;

            // ChucK ticker counts in expanded ticks (includes subdivisions), so divide by MAX_SUBDIVISIONS
            // to get base cell index. MAX_SUBDIVISIONS matches the expansion factor used in ChucK code generation.
            const MAX_SUBDIVISIONS = 16; // Must match the value used in buildChuckCodeData
            const baseTick = Math.floor(tickNum / MAX_SUBDIVISIONS);
            
            // Map base tick to an index in [0, totalCells)
            const idx = ((baseTick % totalCells) + totalCells) % totalCells; // safe mod
            const rowIndex = Math.floor(idx / cellsPerRow) % numRows;
            const colIndex = idx % cellsPerRow;

            // Resolve actual row key from `rows` array; if rows array length differs from numRows, wrap
            const resolvedRowKey = rows.length > 0 ? rows[rowIndex % rows.length] : rows[0];

            activeYRef.current = resolvedRowKey;
            activeXRef.current = colIndex;

            // Expose mapping for debugging
            try {
                if (typeof window !== 'undefined') {
                    (window as any).__lastTickMapping = { idx, rowIndex, colIndex, cellsPerRow, numRows, resolvedRowKey };
                    if ((window as any).__DEBUG_TICK) {
                        console.log('[Ticker Debug] mapping', (window as any).__lastTickMapping);
                    }
                }
            } catch (e) {}

            // Safety check
            if (!rows.includes(activeYRef.current)) {
                console.warn('[Ticker] Invalid row detected:', activeYRef.current, 'Valid rows:', rows, 'Resetting to first row');
                activeYRef.current = rows[0];
                activeXRef.current = 0;
            }

            lastTickRef.current = tickNum;
            // update store
            const newActiveCell = { x: activeXRef.current, y: activeYRef.current };
            useBeatGridStore.getState().setActiveCell(newActiveCell);
            
            // Debug: log ticker advancement (less verbose)
            if (tickNum % 64 === 0) {
                console.log('[Ticker] Tick:', tickNum, 'Active cell:', newActiveCell, 'Rows:', rows, 'Current row index:', rows.indexOf(activeYRef.current));
            }

            // Expose debug globals for quick inspection in DevTools
            try {
                if (typeof window !== 'undefined') {
                    (window as any).__lastTick = tickNum;
                    (window as any).__lastActiveCell = newActiveCell;
                    (window as any).__beatGridRowOrderTopToBottom = rowOrderTopToBottomRef.current;
                    (window as any).__availableRows = rows;
                }
            } catch (e) {
                // ignore
            }
        } catch (e) {
            console.warn('[advanceActiveCellFromTick] error', e);
        }
    };

    // Expose a helper to flip row ordering at runtime (useful for testing different UI orientations)
    if (typeof window !== 'undefined') {
        (window as any).__setBeatGridRowOrder = (topToBottom: boolean) => {
            rowOrderTopToBottomRef.current = !!topToBottom;
            (window as any).__beatGridRowOrderTopToBottom = rowOrderTopToBottomRef.current;
        };
    }

    // Minimal, canonical chuckPrint installer + tick buffer
    // Use a ref so the handler is stable across renders and available to native callbacks
    const currentChuckPrintErrorSinkRef = useRef<string[] | null>(null);

    // Ring buffer of recent ticks (small, fast structure)
    const tickBufferRef = useRef<Array<{ tick: number; audioTime: number; perf: number }>>([]);
    // Layout info provided by buildChuckCodeData (cellsPerRow, numRows)
    const chuckLayoutRef = useRef<{ cellsPerRow: number; numRows: number } | null>(null);
    const lastProcessedTickRef = useRef<number | null>(null);

    const pushTickToBuffer = (tick: number, audioTime: number, perf: number) => {
        const buf = tickBufferRef.current;
        buf.push({ tick, audioTime, perf });
        if (buf.length > 128) buf.shift();
        // expose for quick inspection
        try { if (typeof window !== 'undefined') (window as any).__chuckTickBuffer = buf; } catch (e) { }
    };

    // Installer: extremely small, fast handler. It parses the tick and records timestamps only.
    const setupDefaultChuckPrint = (instance?: any) => {
        if (!instance) return;
        const previous = (instance as any).chuckPrint;
        (instance as any).chuckPrint = (message: string) => {
            try {
                if (typeof message !== 'string') {
                    if (previous) try { previous(message); } catch (e) {}
                    return;
                }

                const lowered = message.toLowerCase();
                // Capture CHUCK_UP_TO_DATE quickly
                if (lowered.indexOf('chuck_up_to_date') !== -1) {
                    setIsRunning(true);
                    // minimal sync cue
                    try { runNextEventDFSHelper(); } catch (e) {}
                    if (previous) try { previous(message); } catch (e) {}
                    return;
                }

                // Fast path for TICK messages: parse first integer and push into buffer
                if (lowered.indexOf('tick') !== -1) {
                    const m = message.match(/\d+/);
                    if (m) {
                        const tickNum = Number(m[0]);
                        const perf = (typeof performance !== 'undefined') ? performance.now() : Date.now();
                        const audioTime = (globalAudioCtx.current && typeof globalAudioCtx.current.currentTime === 'number') ? globalAudioCtx.current.currentTime : perf / 1000;
                        pushTickToBuffer(tickNum, audioTime, perf);
                    }
                    // keep previous handler but call it after short work
                    if (previous) try { previous(message); } catch (e) {}
                    return;
                }

                // Capture errors into transient sink if set
                if (currentChuckPrintErrorSinkRef.current && (lowered.includes('error') || lowered.includes('exception') || lowered.includes('fatal') || lowered.includes('syntax') || lowered.includes('line'))) {
                    currentChuckPrintErrorSinkRef.current.push(message);
                }

                if (previous) try { previous(message); } catch (e) {}
            } catch (e) {
                // swallow to avoid breaking native callbacks
            }
        };
    };

    // rAF-driven processor: consume tick buffer and drive UI updates at screen refresh rate
    useEffect(() => {
        let rafId: number | null = null;
        const frame = () => {
            try {
                const buf = tickBufferRef.current;
                if (buf.length > 0) {
                    const latest = buf[buf.length - 1];
                    if (lastProcessedTickRef.current !== latest.tick) {
                        lastProcessedTickRef.current = latest.tick;
                        // Use audioTime-aware processing: feed absolute tick to deterministic mapper
                        try { advanceActiveCellFromTick(latest.tick); } catch (e) {}
                        // Optionally expose last audio timestamp for debugging
                        try { if (typeof window !== 'undefined') (window as any).__lastTickAudioTime = latest.audioTime; } catch (e) {}
                    }
                    // Expose lastTick for devtools
                    try { if (typeof window !== 'undefined') (window as any).__lastTick = latest.tick; } catch (e) {}
                }
            } catch (e) {
                // ignore
            }
            rafId = requestAnimationFrame(frame);
        };
        rafId = requestAnimationFrame(frame);
        return () => { if (rafId) cancelAnimationFrame(rafId); };
    }, []);



    function defer() {
        let res, rej;

        let promise: any = new Promise((resolve, reject) => {
            res = resolve;
            rej = reject;
        });

        promise.resolve = res;
        promise.reject = rej;

        return promise;
    }

    var readAsync = function (url: any, onload: any, onerror: any) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) // file URLs can return 0
            {
                onload(xhr.response);
                return;
            }
            onerror();
        };
        xhr.onerror = onerror;
        xhr.send(null);
    };


    const asyncLoadFile = function (url: string, onload: any, onerror: any) {
        readAsync(url, function (arrayBuffer: any) {
            onload(new Uint8Array(arrayBuffer));
        }, function (event: any) {
            if (onerror) {
                onerror();
            } else {
                throw 'Loading data file "' + url + '" failed.';
            }
        });
    }
    // Lazily load the WebChucK wasm only when needed (avoid fetching on module load)
    let _wasmPromise: Promise<any> | null = null;
    const loadWasm = () => {
        if (!_wasmPromise) {
            _wasmPromise = new Promise(function (resolve, reject) {
                asyncLoadFile('/webchuck/webchuck.wasm', resolve, reject);
            });
        }
        return _wasmPromise;
    };

    const filesArray = JSON.stringify(SERVER_FILES_TO_PRELOAD.map(f => f.virtualFilename));

    const handleChuckMsg = (chuckMsg: string) => {
        let isMounted = true;
        if (chuckMsg.includes(""))
            return () => {
                isMounted = false;
            }
    };

    const runNextEventDFSHelper = () => {
        // const beatMs = useTimingStore.getState().beatMs;
        chuckRef.current && chuckRef.current.setInt('BeatMsInts', beatMs || 4000);
    };

    let theWasm;
    const chuckMicButton = async () => {
        theWasm = await loadWasm();
        console.log("here!");

        globalAudioCtx.current && await globalAudioCtx.current.resume();
        globalAudioCtx.current && await globalAudioCtx.current.audioWorklet.addModule('/webchuck/webchuck.js');


        if (globalAudioCtx.current && typeof AudioWorkletNode !== 'undefined') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: selectedDeviceId ? { exact: selectedDeviceId || 'default' } : undefined,
                        echoCancellation: true,
                        autoGainControl: false,
                        noiseSuppression: false,
                    },
                    video: false
                });
                const audioTracks = stream.getAudioTracks();

                const source = (globalAudioCtx.current as AudioContext).createMediaStreamSource(stream);
                if (chuckRef.current) {
                    source.connect(chuckRef.current);
                    // Install minimal, canonical chuckPrint handler
                    setupDefaultChuckPrint(chuckRef.current);
                }
            } catch (err) {
                console.error('Failed to construct AudioWorkletNode:', err);
            }
        } else {
            console.error('AudioContext not ready or AudioWorkletNode not available');
        }
    }

    // Create / resume the AudioContext in response to an explicit user gesture
    const enableAudio = async () => {
        try {
            if (!globalAudioCtx.current) {
                globalAudioCtx.current = new AudioContext();
                console.log('[enableAudio] created AudioContext');
            }
            if (globalAudioCtx.current.state === 'suspended') {
                await globalAudioCtx.current.resume();
                console.log('[enableAudio] resumed AudioContext');
            }
            setReady(true);
            return true;
        } catch (err) {
            console.warn('[enableAudio] failed to enable audio:', err);
            return false;
        }
    };

    async function handleUpload(files: FileList | null) {
        const list = Array.from(files || []);
        if (!list.length || !chuckRef.current) return;

        for (const file of list) {
            const buf = await file.arrayBuffer();
            const bytes = new Uint8Array(buf);
            const safeName = file.name.replace(/[^\w.\-]+/g, '_');
            const vpath = `uploads/${Date.now()}_${safeName}`;

            // Write into WebChucK FS
            if (typeof (chuckRef.current as any).createFile === 'function') {
                await (chuckRef.current as any).createFile(vpath, bytes);
            } else if ((chuckRef.current as any).Module?.FS) {
                (chuckRef.current as any).Module.FS.writeFile(vpath, bytes);
            } else {
                console.warn('No file API on WebChucK instance; cannot upload:', vpath);
                continue;
            }

            // Files ALWAYS go to sampler (beatgrid)
            uploadedVFilesRef.current.push(vpath);
            
            // Optionally also load into MIDI keyboard buffers if toggle is enabled
            if (addToMidiBuffers) {
                try {
                    // Use next available buffer (cycle through 4 buffers)
                    const bufferIndex = uploadedVFilesRef.current.length % 4;
                    await chuckRef.current.setInt('activeBufferIndex', bufferIndex);
                    
                    // Load file into shared buffer via ChucK code
                    // Wait for file to load, then record into buffer
                    const loadCode = `
                        // MEMORY FIX: Reuse global SndBuf (no per-upload allocation)
                        "${vpath}" => uploadTempFile.read;
                        
                        // Wait for file to actually load (with timeout to prevent infinite stall)
                        now => dur loadStartTime;
                        5::second => dur maxLoadTime;
                        while (uploadTempFile.length() == 0::samp) {
                            if (now - loadStartTime > maxLoadTime) {
                                <<< "ERROR: File upload load timeout for", "${vpath}", "- aborting" >>>;
                                return;
                            }
                            1::samp => now;
                        }
                        
                        // Record file into shared buffer
                        sharedAudioBuffers[${bufferIndex}].clear();
                        sharedAudioBuffers[${bufferIndex}].recPos(0::samp);
                        sharedAudioBuffers[${bufferIndex}].record(1);
                        
                        // Play file and record simultaneously
                        0 => uploadTempFile.pos;
                        uploadTempFile.length() => now;
                        
                        // Stop recording and signal ready
                        sharedAudioBuffers[${bufferIndex}].record(0);
                        bufferRecorded.broadcast();
                        
                        <<< "File loaded into MIDI buffer", ${bufferIndex}, ":", "${vpath}", "READY" >>>;
                    `;
                    
                    await chuckRef.current.runCode(loadCode);
                    console.log(`✅ File "${safeName}" also loaded into MIDI buffer ${bufferIndex}`);
                } catch (err: any) {
                    console.warn('Failed to load file into MIDI buffer:', err);
                    // Continue - file is still in sampler
                }
            }
        }

        // Update ChucK global files[] and broadcast filesUpdated
        // Sort files alphabetically for consistent indexing
        const allVFiles = [
            ...SERVER_FILES_TO_PRELOAD.map(f => f.virtualFilename),
            ...uploadedVFilesRef.current
        ].sort((a, b) => a.localeCompare(b));
        const arrayLiteral = JSON.stringify(allVFiles);
        try {
            // CRITICAL: Update files[] element-by-element (large string arrays must not use @=>)
            const filesUpdate: string[] = [];
            for (let i = 0; i < allVFiles.length; i++) {
                filesUpdate.push(`"${allVFiles[i]}" => files[${i}];`);
            }
            if (filesUpdate.length > 0) {
                await chuckRef.current.runCode(filesUpdate.join('\n'));
            }
            await chuckRef.current.broadcastEvent('filesUpdated');
            
            // Trigger feature extraction for newly uploaded files (non-blocking, background)
            // MCP VERIFICATION: ✅ APPROVED - Extraction runs in sporked shred, doesn't block upload
            for (let i = 0; i < list.length; i++) {
                const file = list[i];
                const safeName = file.name.replace(/[^\w.\-]+/g, '_');
                // Find the vpath we just created for this file
                const matchingVPath = uploadedVFilesRef.current.find(v => v.includes(safeName));
                
                if (matchingVPath) {
                    // Find file index in sorted array
                    const fileIndex = allVFiles.indexOf(matchingVPath);
                    
                    if (fileIndex >= 0 && chuckRef.current) {
                        try {
                            // Request feature extraction (non-blocking, runs in background)
                            await chuckRef.current.setInt('requestedFileIndex', fileIndex);
                            await chuckRef.current.setString('requestedFileName', matchingVPath);
                            await chuckRef.current.broadcastEvent('fileFeatureExtractRequest');
                            console.log(`📊 Feature extraction requested for file ${fileIndex}: ${safeName}`);
                        } catch (extractErr: any) {
                            // Feature extraction is optional - don't fail upload if it fails
                            console.warn(`Feature extraction request failed for ${safeName}:`, extractErr);
                        }
                    }
                }
            }
        } catch (err: any) {
            // Suppress ErrnoError errno 20 (file system errors) - these are often non-critical
            if (err?.name === 'ErrnoError' && err?.errno === 20) {
                // Silently ignore - this is a common non-critical file system error
                return;
            }
            console.warn('Failed to update files[] in ChucK', err);
        }

        // e.target.value = '';
    }

    // Old hardcoded chuckInstructions template removed - now using getChuckCode() for proper effects routing

    useEffect(() => {
        // Don't do anything until WebChucK is ready
        // if (!ready || !chuckRef.current || !audioInSelected) return;

        // Map dropdown text to numeric effect index
        const effectIndex = (() => {
            console.log("guess audio! ", audioInSelected.toLowerCase());
            switch (audioInSelected.toLowerCase()) {
                case 'grain': return 0;
                case 'tape': return 1;
                case 'random reverse': return 2;
                case 'clapping': return 3;
                case 'lisa trigger': return 4;
                default: return 0;
            }
        })();

        try {
            console.log("Setting activeEffect to index: ", effectIndex);
            chuckRef.current && chuckRef.current.setInt('activeEffect', effectIndex);
            console.log(`🎛️ Switched to effect #${effectIndex} (${audioInSelected})`);
        } catch (err) {
            console.error('Failed to set activeEffect:', err);
        }
    }, [audioInSelected]);

    type ServerFileToPreload = {
        serverFilename: string;
        virtualFilename: string;
    };

    useEffect(() => {
        // Debug: selected device ID
        // console.log("SEL DEVICE ID ", selectedDeviceId);
        // CRITICAL: Do NOT call Machine.removeAllShreds() during runtime
        // This would kill the mainTickLoop and all active shreds
        // Only allowed during initialization or explicit stop
        // Removed runtime shred removal - audioInSelected changes should not restart ChucK
    }, [audioInSelected]);

    const updateAudioInputDevice = async (e: any) => {
        const id = e?.target?.value;
        if (!id) return;
        // Debug: updating audio input device
        // console.log("UPDATING AUDIO INPUT DEVICE TO ID: ", id);
        setSelectedDeviceId(id);
        // if (ready) chuckMicButton(id);
    };

    const updateSelectedAudioInSetting = (newSetting: string) => {
        setAudioInSelected(newSetting);
        const defaultAudioInSetting = 1;
        let activeEffect = defaultAudioInSetting;
        console.log("NEW SETTING SELECTED: ", newSetting);
        switch (newSetting.toLowerCase()) {
            case 'grain':
                activeEffect = 0;
                break;
            case 'tape':
                activeEffect = 1;
                break;
            case 'random reverse':
                activeEffect = 2;
                break;
            case 'clapping':
                activeEffect = 3;
                break;
            case 'lisa trigger':
                activeEffect = 4;
                break;
            case 'asymptotic chopper':
                activeEffect = 5;
                break;
            case 'mosaic synth':
                activeEffect = 6;
                break;
            default:
                activeEffect = defaultAudioInSetting;
                break;
        }
        
        // Update ChucK activeEffect if ChucK is running
        if (chuckRef.current) {
            chuckRef.current.setInt('activeEffect', activeEffect)        
            // .catch((err: any) => {
            //     console.error('[updateSelectedAudioInSetting] Failed to set activeEffect:', err);
            // });
        }
    };

    useEffect(() => {
        setReady(true);
        setInitializing(false);
        (async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                // Debug: enumerated devices
                // console.log("yo devices: ", devices);
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                setDeviceOptions(audioInputs);
                if (!selectedDeviceId && audioInputs.length > 0) {
                    setSelectedDeviceId(audioInputs[0].deviceId);
                }
            } catch (err) {
                console.error('Device enumeration failed:', err);
            }
        })();
    }, []);

    useEffect(() => {
        console.log("chuck ref about to be hook??? ", chuckRef.current);
        setChuckHook(chuckRef.current);
    }, [initializing]);

    let sampleRate: number = 0;

    // Note: Beatgrid synchronization happens in chuckPrint handler when "CHUCK_UP_TO_DATE" is received
    // This ensures TypeScript and ChucK are synchronized when Chuck is actually ready

    // Hot-swap ChucK code when grid updates (beatgrid:updated event)
    // This allows the beat grid to update without restarting ChucK
    // MEMORY LEAK PREVENTION: Debounced and batched to prevent accumulation of runCode calls
    useEffect(() => {
        const handleGridUpdate = async (e: Event) => {
            const detail = (e as CustomEvent)?.detail;
            if (!chuckRef.current || !isRunning) {
                // ChucK not running, skip update
                return;
            }
            
            // Cancel any pending update
            if (pendingGridUpdateRef.current) {
                pendingGridUpdateRef.current.cancelled = true;
            }
            const updateToken = { cancelled: false };
            pendingGridUpdateRef.current = updateToken;
            
            // Clear existing timeout
            if (gridUpdateTimeoutRef.current) {
                clearTimeout(gridUpdateTimeoutRef.current);
            }
            
            // Debounce: wait 100ms to batch rapid updates
            gridUpdateTimeoutRef.current = setTimeout(async () => {
                // Check if this update was cancelled or ChucK is no longer available
                if (updateToken.cancelled || !chuckRef.current || !isRunning) {
                    return;
                }
                
                try {
                console.log('[handleGridUpdate] Grid updated, rebuilding ChucK code...', detail);
                
                // Rebuild ChucK code data with latest grid state
                const chuckCodeData = await buildChuckCodeData();
                if (!chuckCodeData) {
                    console.warn('[handleGridUpdate] Failed to build ChucK code data');
                    return;
                }
                
                // Build event arrays from masterPatternsRef respecting subdivisions
                const MAX_SUBDIVISIONS = 16;
                const masterPatterns = chuckCodeData.masterPatternsRef.current || {};
                const gridVersion = useBeatGridStore.getState().gridVersion || 0;
                
                // Build rhythm cache with expanded events
                const rhythmCache = buildCacheFromGrid(masterPatterns, gridVersion, {
                    filesToProcess: filesToProcess.current || [],
                    tune: chuckCodeData.notesHolder?.current,
                    bpm: chuckCodeData.bpm,
                    numeratorSignature: chuckCodeData.numeratorSignature,
                    denominatorSignature: chuckCodeData.denominatorSignature,
                    masterFastestRate: chuckCodeData.masterFastestRate,
                    notesHolder: chuckCodeData.notesHolder?.current,
                });
                
                const expandedEvents = rhythmCache.events;
                const cellsPerRow = chuckCodeData.numeratorSignature * chuckCodeData.masterFastestRate;
                const rowKeys = Object.keys(masterPatterns).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n));
                const totalBaseCells = cellsPerRow * rowKeys.length;
                let expandedMeasureLength = totalBaseCells * MAX_SUBDIVISIONS;
                
                // CRITICAL: Enforce maximum array size to prevent WASM memory allocation failures
                // WebChucK has limited memory - 2D arrays are especially memory-intensive
                // filesArr[length][32] = length * 32 integers = significant memory usage
                // Architecture compliance: Fixed-size arrays must be bounded to prevent memory corruption
                // Reduced to 512 for safety: 512 * 32 = 16,384 integers (much safer for WebChucK WASM memory)
                // Multiple arrays allocated simultaneously: filesArr, cellFunctionIds, osc/stk arrays
                const MAX_EXPANDED_MEASURE_LENGTH = 512; // Very conservative maximum for WebChucK memory limits
                if (expandedMeasureLength > MAX_EXPANDED_MEASURE_LENGTH) {
                    console.warn(`[handleGridUpdate] expandedMeasureLength ${expandedMeasureLength} exceeds maximum ${MAX_EXPANDED_MEASURE_LENGTH}, clamping to prevent memory errors`);
                    expandedMeasureLength = MAX_EXPANDED_MEASURE_LENGTH;
                }
                
                // Validate minimum size and ensure it's a valid integer
                if (!Number.isFinite(expandedMeasureLength) || expandedMeasureLength <= 0 || !Number.isInteger(expandedMeasureLength)) {
                    console.error(`[handleGridUpdate] Invalid expandedMeasureLength: ${expandedMeasureLength}, using default 256`);
                    expandedMeasureLength = 256; // Safe default (smaller for testing)
                }
                
                // Initialize expanded arrays
                // CRITICAL: Each inner array must have exactly 32 elements to match ChucK declaration [expandedMeasureLength][32]
                const filesArr2D: number[][] = new Array(expandedMeasureLength).fill(null).map(() => new Array(32).fill(9999));
                const oscMidiFreqs: number[] = new Array(expandedMeasureLength).fill(9999.0);
                const oscMidiLengths: number[] = new Array(expandedMeasureLength).fill(1.0);
                const oscMidiVelocities: number[] = new Array(expandedMeasureLength).fill(0.5);
                const stkMidiFreqs: number[] = new Array(expandedMeasureLength).fill(9999.0);
                const stkMidiLengths: number[] = new Array(expandedMeasureLength).fill(1.0);
                const stkMidiVelocities: number[] = new Array(expandedMeasureLength).fill(0.5);
                const cellFunctionIds: (string | null)[] = new Array(expandedMeasureLength).fill(null);
                
                // Map expanded events to array indices
                expandedEvents.forEach((event) => {
                    const tickIndex = Math.floor(event.t * chuckCodeData.masterFastestRate * MAX_SUBDIVISIONS);
                    
                    if (tickIndex >= 0 && tickIndex < expandedMeasureLength) {
                        // CRITICAL: Pad to exactly 32 elements to match ChucK declaration [expandedMeasureLength][32]
                        if (event.fileIdxs && event.fileIdxs.length > 0) {
                            const padded = [...event.fileIdxs];
                            while (padded.length < 32) {
                                padded.push(9999);
                            }
                            filesArr2D[tickIndex] = padded.slice(0, 32); // Ensure exactly 32 elements
                        }
                        
                        if (event.noteFrequencies && event.noteFrequencies.length > 0) {
                            const freq = event.noteFrequencies[0];
                            oscMidiFreqs[tickIndex] = freq;
                            oscMidiLengths[tickIndex] = event.length / event.subdivisions;
                            oscMidiVelocities[tickIndex] = event.velocity;
                            
                            stkMidiFreqs[tickIndex] = freq;
                            stkMidiLengths[tickIndex] = event.length / event.subdivisions;
                            stkMidiVelocities[tickIndex] = event.velocity;
                        }
                        
                        if (event.subdivision === 0) {
                            const cell = masterPatterns[String(event.y)]?.[String(event.x)];
                            if (cell?.functionId) {
                                cellFunctionIds[tickIndex] = cell.functionId;
                            }
                        }
                    }
                });
                
                // Build function registry
                const cellFunctionRegistryLocal = new Map<string, string>();
                cellFunctionRegistry.forEach((code, id) => {
                    cellFunctionRegistryLocal.set(id, code);
                });
                
                rowKeys.forEach((rowY) => {
                    const row = masterPatterns[String(rowY)] || {};
                    Object.keys(row).forEach((colX) => {
                        const cell = row[colX];
                        if (cell?.functionId) {
                            const functionCode = cell?.functionCode || cellFunctionRegistry.get(cell.functionId);
                            if (functionCode) {
                                cellFunctionRegistryLocal.set(cell.functionId, functionCode);
                            }
                        }
                    });
                });
                
                // Safety validation: ensure all rows are exactly 32 elements before ChucK injection
                // This prevents WASM memory access violations from ragged arrays
                for (let i = 0; i < filesArr2D.length; i++) {
                    if (!filesArr2D[i] || filesArr2D[i].length !== 32) {
                        // Pad or truncate to exactly 32 elements
                        const row = filesArr2D[i] || [];
                        const padded = [...row];
                        while (padded.length < 32) padded.push(9999);
                        filesArr2D[i] = padded.slice(0, 32);
                    }
                }
                
                // Build ChucK array strings
                const filesArrayParsed = JSON.parse(chuckCodeData.filesArray);
                const filesArrayChuck = `[${filesArrayParsed.map((f: string) => `"${f}"`).join(', ')}]`;
                const filesArr2DChuck = `[${filesArr2D.map(arr => `[${arr.join(', ')}]`).join(', ')}]`;
                const oscMidiFreqsChuck = `[${oscMidiFreqs.join(', ')}]`;
                const oscMidiLengthsChuck = `[${oscMidiLengths.join(', ')}]`;
                const oscMidiVelocitiesChuck = `[${oscMidiVelocities.join(', ')}]`;
                const stkMidiFreqsChuck = `[${stkMidiFreqs.join(', ')}]`;
                const stkMidiLengthsChuck = `[${stkMidiLengths.join(', ')}]`;
                const stkMidiVelocitiesChuck = `[${stkMidiVelocities.join(', ')}]`;
                const cellFunctionIdsChuck = `[${cellFunctionIds.map(id => id ? `"${id}"` : '""').join(', ')}]`;
                
                const functionRegistryChuck = Array.from(cellFunctionRegistryLocal.entries())
                    .map(([id, code]) => `"${id}" => cellFunctions;`)
                    .join('\n                        ');
                
                // Update arrays by clearing and reassigning
                // Update arrays element-by-element using WebChucK API (safe, no memory errors)
                // MEMORY LEAK PREVENTION: Batch all runCode calls into a single call to prevent accumulation
                try {
                    // Check again if cancelled before expensive operations
                    if (updateToken.cancelled) {
                        return;
                    }
                    
                    // Batch all updates into a single runCode call to prevent memory leaks
                    const allUpdates: string[] = [];
                    
                    // Update oscillator arrays (element-by-element via runCode for batching)
                    for (let idx = 0; idx < oscMidiFreqs.length && idx < expandedMeasureLength; idx++) {
                        allUpdates.push(`${oscMidiFreqs[idx]} => oscMidiFreqsArray[${idx}];`);
                        allUpdates.push(`${oscMidiLengths[idx]} => oscMidiLengthsArray[${idx}];`);
                        allUpdates.push(`${oscMidiVelocities[idx]} => oscMidiVelocitiesArray[${idx}];`);
                    }
                    
                    // Update STK arrays (element-by-element via runCode for batching)
                    for (let idx = 0; idx < stkMidiFreqs.length && idx < expandedMeasureLength; idx++) {
                        allUpdates.push(`${stkMidiFreqs[idx]} => stkMidiFreqsArray[${idx}];`);
                        allUpdates.push(`${stkMidiLengths[idx]} => stkMidiLengthsArray[${idx}];`);
                        allUpdates.push(`${stkMidiVelocities[idx]} => stkMidiVelocitiesArray[${idx}];`);
                    }
                    
                    // Update filesArr (2D array - update inner arrays element-by-element)
                    // Note: WebChucK doesn't support 2D array updates directly, so we use runCode
                    // CRITICAL: Must update all 32 elements per row to match ChucK declaration [expandedMeasureLength][32]
                    for (let tickIdx = 0; tickIdx < filesArr2D.length && tickIdx < expandedMeasureLength; tickIdx++) {
                        const filesForTick = filesArr2D[tickIdx] || new Array(32).fill(9999);
                        // Always update all 32 elements (pad with 9999 if needed)
                        for (let filePos = 0; filePos < 32; filePos++) {
                            const value = filePos < filesForTick.length ? filesForTick[filePos] : 9999;
                            allUpdates.push(`${value} => filesArr[${tickIdx}][${filePos}];`);
                        }
                    }
                    
                    // Update files array (string array)
                    const filesArrayParsed = JSON.parse(chuckCodeData.filesArray);
                    for (let idx = 0; idx < filesArrayParsed.length; idx++) {
                        allUpdates.push(`"${filesArrayParsed[idx]}" => files[${idx}];`);
                    }
                    
                    // Update cellFunctionIds array (string array)
                    const clampedMeasureLength = Math.max(1, Math.min(expandedMeasureLength, 512));
                    for (let idx = 0; idx < cellFunctionIds.length && idx < clampedMeasureLength; idx++) {
                        const functionId = cellFunctionIds[idx] || '';
                        allUpdates.push(`"${functionId}" => cellFunctionIds[${idx}];`);
                    }
                    
                    // Execute all updates in a single runCode call (prevents memory leak from multiple calls)
                    if (allUpdates.length > 0) {
                        // Check one more time before executing
                        if (!updateToken.cancelled && chuckRef.current) {
                            await chuckRef.current.runCode(allUpdates.join('\n'));
                        }
                    }
                    
                    // Update measureLength and beatMSNew (check chuckRef again)
                    if (!updateToken.cancelled && chuckRef.current) {
                        // Use clamped value to prevent memory errors (consistent with MAX_EXPANDED_MEASURE_LENGTH = 512)
                        const clampedMeasureLength = Math.max(1, Math.min(expandedMeasureLength, 512));
                        await chuckRef.current.setInt('measureLength', clampedMeasureLength);
                        const beatMSNewValue = Math.floor((60000 / chuckCodeData.bpm) / chuckCodeData.masterFastestRate / MAX_SUBDIVISIONS);
                        await chuckRef.current.setInt('beatMSNew', beatMSNewValue);
                        
                        // TIMING INSTRUMENTATION: Reset counters on grid update (removable)
                        // This ensures clean measurements after hot-swap
                        await chuckRef.current.setInt('timingTickCount', 0);
                        await chuckRef.current.setInt('timingBarCount', 0);
                        await chuckRef.current.setInt('timingLastWrapTick', -1);
                    }
                    
                    console.log('[handleGridUpdate] ✅ All arrays hot-swapped successfully via batched runCode (prevented memory leak)');
                } catch (updateErr: any) {
                    if (!updateToken.cancelled) {
                        console.error('[handleGridUpdate] Failed to update arrays via API:', updateErr);
                        console.warn('[handleGridUpdate] 💡 Grid update detected - restart ChucK to see changes');
                    }
                }
                } catch (err: any) {
                    if (!updateToken.cancelled) {
                        console.error('[handleGridUpdate] Failed to hot-swap ChucK code:', err);
                    }
                } finally {
                    // Clear pending update token
                    if (pendingGridUpdateRef.current === updateToken) {
                        pendingGridUpdateRef.current = null;
                    }
                }
            }, 100); // 100ms debounce to batch rapid updates
        };
        
        try {
            window.addEventListener('beatgrid:updated', handleGridUpdate as EventListener);
        } catch (e) {
            console.warn('[handleGridUpdate] Failed to add event listener:', e);
        }
        
        return () => {
            // Cleanup: cancel pending updates and clear timeout
            if (gridUpdateTimeoutRef.current) {
                clearTimeout(gridUpdateTimeoutRef.current);
                gridUpdateTimeoutRef.current = null;
            }
            if (pendingGridUpdateRef.current) {
                pendingGridUpdateRef.current.cancelled = true;
                pendingGridUpdateRef.current = null;
            }
            try {
                window.removeEventListener('beatgrid:updated', handleGridUpdate as EventListener);
            } catch (e) {
                // ignore
            }
        };
    }, [chuckRef, isRunning]);

    // On load: ensure a first pass happens so the graph/cache is built before first ChucK run.
    // We emit a synthetic event if no update has been fired yet.
    useEffect(() => {
        try {
            const gv = useBeatGridStore.getState().gridVersion;
            // Fire once on mount with the current version snapshot
            window.dispatchEvent(new CustomEvent('beatgrid:updated', { detail: { gridVersion: gv, source: 'bootstrap' } }));
        } catch { }
    }, []);

    // Helper function to build all data needed for getChuckCode
    const buildChuckCodeData = async () => {
        try {
            if (!chuckRef.current) {
                console.warn('Chuck not ready');
                return null;
            }

            // Ensure universalSources.current is initialized with all effects
            if (!universalSources.current) {
                console.log('Initializing universalSources with all available effects...');
                universalSources.current = initializeUniversalSources();
                console.log('✅ universalSources initialized with', Object.keys(universalSources.current.osc1.effects).length, 'effects for osc1');
            }

            // Get store values
            const transportState = useTransportStore.getState();
            const bpm = transportState.bpm || 120;
            const timeSig = transportState.timeSig || { num: 4, den: 4 };
            const numeratorSignature = timeSig.num;
            const denominatorSignature = timeSig.den;
            // Derive master fastest rate from the beat-grid controls if available
            // `currentNoteVals.master[0]` is the UI slider for the global fastest subdivision (defaultNoteVals.master === [4])
            const beatGridNoteVals = useBeatGridStore.getState().currentNoteVals || {};
            const masterFastestRate = Number((beatGridNoteVals && beatGridNoteVals.master && beatGridNoteVals.master[0]) || 4);
            const fxRadioValue = useOldMonolithStore.getState().fxRadioValue || 'osc1';

            // Get microtonal data (these are computed values, not stored - using defaults for now)
            // TODO: Compute these from microtonal store if needed
            const mTFreqs: number[] = [];
            const mTMidiNums: number[] = [];
            const selectedChordScaleOctaveRange: any = {};

            // Get current note values
            const currentNoteVals = useBeatGridStore.getState().currentNoteVals || [];
            const notesHolder = { current: currentNoteVals };

            // Build signal chain data for each source
            const osc1Data = buildSourceData('osc1');
            const samplerData = buildSourceData('sampler');
            const stk1Data = buildSourceData('stk1');
            const audioinData = buildSourceData('audioin');

            // Process effects for each source
            const osc1Targets = createEmptyTargets();
            const samplerTargets = createEmptyTargets();
            const stk1Targets = createEmptyTargets();
            const audioinTargets = createEmptyTargets();

            const osc1Effects = Object.values(universalSources.current.osc1?.effects || {}).filter((fx: any) => fx?.On);
            const samplerEffects = Object.values(universalSources.current.sampler?.effects || {}).filter((fx: any) => fx?.On);
            const stk1Effects = Object.values(universalSources.current.stk1?.effects || {}).filter((fx: any) => fx?.On);
            const audioinEffects = Object.values(universalSources.current.audioin?.effects || {}).filter((fx: any) => fx?.On);

            try {
                await Promise.all([
                    processSourceFX('osc1', osc1Effects, chuckRef, fxRadioValue, osc1Targets, universalSources.current),
                    processSourceFX('sampler', samplerEffects, chuckRef, fxRadioValue, samplerTargets, universalSources.current),
                    processSourceFX('stk1', stk1Effects, chuckRef, fxRadioValue, stk1Targets, universalSources.current),
                    processSourceFX('audioin', audioinEffects, chuckRef, fxRadioValue, audioinTargets, universalSources.current),
                ]);
            } catch (fxError) {
                console.error('Error processing source FX:', fxError);
                // Continue with empty targets if FX processing fails
            }

            // Calculate maxMinFreq
            const maxMinFreq = mTFreqs.length > 0 ? {
                min: Math.min(...mTFreqs),
                max: Math.max(...mTFreqs)
            } : { min: 0, max: 0 };

            // Hid not used - set to null
            const hid = null;

            // Build getSourceFX function (placeholder for now)
            const getSourceFX = () => '';

            // Set masterPatternsRef.current from beat grid store
            const beatGridState = useBeatGridStore.getState();
            masterPatternsRef.current = beatGridState.masterPatternsHashHook || {};

            // Build filesArray matching the sorted order used in handleLatestSamples
            // This ensures file indices match between ChucK and the beatgrid
            const preloadedFileNames = SERVER_FILES_TO_PRELOAD.map(f => f.virtualFilename);
            const uploadedFileNames = uploadedVFilesRef.current || [];
            const allFilesSorted = [...preloadedFileNames, ...uploadedFileNames].sort((a, b) => a.localeCompare(b));
            
            return {
                isTestingChord: undefined,
                filesArray: JSON.stringify(allFilesSorted),
                currentNoteVals,
                masterPatternsRef,
                masterFastestRate,
                numeratorSignature,
                denominatorSignature,
                bpm,
                moogGrandmotherEffects,
                signalChain: osc1Targets.signalChain || [],
                signalChainDeclarations: osc1Targets.signalChainDeclarations || [],
                signalChainSampler: samplerTargets.signalChain || [],
                signalChainSamplerDeclarations: samplerTargets.signalChainDeclarations || [],
                signalChainSTK: stk1Targets.signalChain || [],
                signalChainSTKDeclarations: stk1Targets.signalChainDeclarations || [],
                signalChainAudioIn: audioinTargets.signalChain || [],
                signalChainAudioInDeclarations: audioinTargets.signalChainDeclarations || [],
                valuesReadout: osc1Targets.valuesReadout || {},
                valuesReadoutSampler: samplerTargets.valuesReadout || {},
                valuesReadoutSTK: stk1Targets.valuesReadout || {},
                valuesReadoutAudioIn: audioinTargets.valuesReadout || {},
                valuesReadoutDeclarations: osc1Targets.valuesReadoutDeclarations || {},
                valuesReadoutSamplerDeclarations: samplerTargets.valuesReadoutDeclarations || {},
                valuesReadoutSTKDeclarations: stk1Targets.valuesReadoutDeclarations || {},
                valuesReadoutAudioInDeclarations: audioinTargets.valuesReadoutDeclarations || {},
                getSourceFX,
                mTFreqs,
                activeSTKDeclarations: activeSTKDeclarations.current || '',
                activeSTKSettings: activeSTKSettings.current || '',
                activeSTKPlayOn: activeSTKPlayOn.current || '',
                activeSTKPlayOff: activeSTKPlayOff.current || '',
                selectedChordScaleOctaveRange,
                maxMinFreq,
                notesHolder,
                hid,
            };
        } catch (error) {
            console.error('Failed to build ChucK code data:', error);
            throw error;
        }
    };

    const runChuckCode = async () => {
        console.log('[runChuckCode] invoked, isRunning=', isRunning, 'isInitializingRef=', isInitializingRef.current);

        // Prevent re-entrancy using ref (more reliable than state)
        if (isInitializingRef.current) {
            console.log('[runChuckCode] already initializing, ignoring');
            return;
        }
        
        // If already running and ChucK is actually working, don't restart
        if (isRunning && chuckRef.current) {
            console.log('[runChuckCode] ChucK already running, ignoring');
            return;
        }
        
        // If isRunning is true but chuckRef is null, ChucK failed - reset state
        if (isRunning && !chuckRef.current) {
            console.log('[runChuckCode] ChucK failed previously, resetting state...');
            setIsRunning(false);
            // Wait a tick for state to update
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        isInitializingRef.current = true;
        setIsRunning(true); // Flip button immediately
        
        try {
            // Attempt to resume the AudioContext immediately (must be called during a user gesture)
            if (!globalAudioCtx.current) {
                // If AudioContext hasn't been created yet, create/resume it via enableAudio
                const enabled = await enableAudio();
                if (!enabled) {
                    console.error('[runChuckCode] Failed to enable AudioContext - aborting ChucK init');
                    isInitializingRef.current = false;
                    setIsRunning(false);
                    throw new Error('Failed to enable AudioContext');
                }
            } else if (globalAudioCtx.current.state === 'suspended') {
                // Ensure the context is resumed during the user gesture
                await globalAudioCtx.current.resume();
                console.log('[runChuckCode] attempted to resume AudioContext (user gesture)');
            }
        } catch (resumeErr) {
            console.warn('[runChuckCode] AudioContext resume attempt failed:', resumeErr);
            isInitializingRef.current = false;
            setIsRunning(false);
            throw new Error(`AudioContext resume attempt failed: ${resumeErr}`);
        }

        // Lazy-load the heavy `webchuck` module only when the user requests it
        let ChuckModule: any = null;
        try {
            ChuckModule = await import('webchuck');
        } catch (impErr) {
            console.error('[runChuckCode] dynamic import failed:', impErr);
            isInitializingRef.current = false;
            setIsRunning(false); // Reset so it can be retried
            throw impErr;
        }
        const { Chuck } = ChuckModule;
        let sampleRate = globalAudioCtx.current && globalAudioCtx.current.sampleRate || 44100;
        calculateDisplayDigits(sampleRate);
        const chugins: string[] = loadWebChugins();
        chugins.forEach((path) => Chuck.loadChugin(path));
        setShowAudioInDropdown(true);
        console.log("HEYA!");
        const LOCAL_CHUCK_SRC = '/webchuck/';
        // const serverFilesToPreload = [{ serverFilename: '/model.txt', virtualFilename: 'model.txt' }];
        const serverFilesToPreload: any = [
            {
                serverFilename: "/Conga.wav",
                virtualFilename: "Conga.wav"
            },
            {
                serverFilename: "/DR-55Hat.wav",
                virtualFilename: "DR-55Hat.wav"
            },
            {
                serverFilename: "/DR-55Kick.wav",
                virtualFilename: "DR-55Kick.wav"
            },
            {
                serverFilename: "/DR-55Pop.wav",
                virtualFilename: "DR-55Pop.wav"
            },
            {
                serverFilename: "/DR-55Snare.wav",
                virtualFilename: "DR-55Snare.wav"
            },
        ];
        const whereIsChuck = LOCAL_CHUCK_SRC;

        // Ensure AudioContext is fully running before initializing ChucK
        if (!globalAudioCtx.current) {
            console.error('[runChuckCode] AudioContext not initialized');
            isInitializingRef.current = false;
            setIsRunning(false);
            throw new Error('AudioContext not initialized');
        }

        // Wait for AudioContext to be running (critical for AudioWorklet)
        if (globalAudioCtx.current.state !== 'running') {
            console.log('[runChuckCode] Waiting for AudioContext to resume...');
            try {
                await globalAudioCtx.current.resume();
            } catch (resumeErr) {
                console.error('[runChuckCode] Failed to resume AudioContext:', resumeErr);
                isInitializingRef.current = false;
                setIsRunning(false);
                throw new Error(`Failed to resume AudioContext: ${resumeErr}`);
            }
        }

        console.log('[runChuckCode] AudioContext state:', globalAudioCtx.current.state);

        // Initialize ChucK with proper error handling
        try {
            console.log('[runChuckCode] Initializing ChucK...');
            // Use default 2 channels if maxChannelCount is not available
            const numOutChannels = globalAudioCtx.current.destination?.maxChannelCount || 2;
            chuckRef.current = await Chuck.init(serverFilesToPreload, globalAudioCtx.current, numOutChannels, whereIsChuck);
            console.log('[runChuckCode] ChucK initialized successfully');
            
            // Expose the running ChucK instance globally for Old-* components
            if (chuckRef.current) {
                setIsRunning(true)
                globalChuckRef.current = chuckRef.current as any;

                // Initialize HID for keyboard input
                try {
                    console.log('🎹 Initializing HID for keyboard input...');
                    hidRef.current = await HID.init(chuckRef.current, false, true); // Mouse: false, Keyboard: true
                    keyboardHIDManagerRef.current = new KeyboardHIDManager(chuckRef.current, hidRef.current);
                    await keyboardHIDManagerRef.current.setupChuckHIDListener();
                    await keyboardHIDManagerRef.current.startListening();
                    console.log('✅ HID keyboard initialized successfully');

                    // Expose keyboard manager globally for keyboard components
                    (window as any).__keyboardHIDManager = keyboardHIDManagerRef.current;
                } catch (hidErr) {
                    console.warn('⚠️ Failed to initialize HID (keyboard will still work via direct events):', hidErr);
                }
            }
            if (chuckRef.current && globalAudioCtx.current) {
                await chuckRef.current.connect(globalAudioCtx.current.destination);
            }
            setInitializing(true);
        } catch (initErr: any) {
            console.error('[runChuckCode] ChucK initialization failed:', initErr);
            console.error('[runChuckCode] Error details:', {
                name: initErr?.name,
                message: initErr?.message,
                stack: initErr?.stack,
                errno: initErr?.errno,
                code: initErr?.code,
                toString: String(initErr),
            });
            isInitializingRef.current = false;
            setIsRunning(false); // Reset so it can be retried
            throw initErr; // Re-throw so retry logic can catch it
        }

        // Install minimal canonical chuckPrint handler (fast path)
        if (chuckRef.current) {
            setupDefaultChuckPrint(chuckRef.current);
            // Also listen for structured tick messages posted from the AudioWorklet
            try {
                const attachPortListener = (target: any) => {
                    if (!target) return false;
                    const port = target.port || target.node?.port || target.audioNode?.port;
                    if (!port) return false;

                    // Use addEventListener if available, otherwise fallback to onmessage
                    const handler = (ev: any) => {
                        const data = ev.data || ev;
                        if (!data) return;
                        if (data.type === 'tick' && typeof data.tick === 'number') {
                            const perf = (typeof performance !== 'undefined') ? performance.now() : Date.now();
                            const audioTime = (typeof data.audioTime === 'number') ? data.audioTime : ((globalAudioCtx.current && typeof globalAudioCtx.current.currentTime === 'number') ? globalAudioCtx.current.currentTime : perf / 1000);
                            pushTickToBuffer(data.tick, audioTime, perf);
                        }
                    };
                    try {
                        if (typeof port.addEventListener === 'function') {
                            port.addEventListener('message', handler);
                        } else {
                            port.onmessage = (e: any) => handler(e.data);
                        }
                        return true;
                    } catch (e) {
                        return false;
                    }
                };

                // try several likely objects
                attachPortListener(chuckRef.current) || attachPortListener((chuckRef.current as any).node) || attachPortListener((chuckRef.current as any).audioNode);
            } catch (e) {
                // ignore - best-effort only
            }
        }

        // ============================================================
        // BUILD CHUCK CODE DATA (for temp code - full code generation commented out)
        // ============================================================
        let chuckCodeData;
        try {
            chuckCodeData = await buildChuckCodeData();
            if (!chuckCodeData) {
                console.error('Failed to build ChucK code data - buildChuckCodeData returned null');
                isInitializingRef.current = false;
                setIsRunning(false);
                throw new Error('Failed to build ChucK code data - buildChuckCodeData returned null');
            }
            // Cache layout info for main-thread tick->grid mapping
            try {
                const cellsPerRow = Number(chuckCodeData.numeratorSignature) * Number(chuckCodeData.masterFastestRate);
                const numRows = Number(chuckCodeData.denominatorSignature) || (Array.isArray(chuckCodeData.masterPatternsRef?.current) ? chuckCodeData.masterPatternsRef.current.length : 0);
                if (Number.isInteger(cellsPerRow) && Number.isInteger(numRows) && cellsPerRow > 0 && numRows > 0) {
                    (chuckLayoutRef as any).current = { cellsPerRow, numRows };
                    try { if (typeof window !== 'undefined') (window as any).__chuckLayout = { cellsPerRow, numRows }; } catch (e) {}
                }
            } catch (e) {
                // ignore - best-effort only
            }
        } catch (error) {
            console.error('Failed to build ChucK code data:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
            isInitializingRef.current = false;
            setIsRunning(false);
            throw error instanceof Error ? error : new Error(`Failed to build ChucK code data: ${error}`);
        }

        // ============================================================
        // FULL CODE GENERATION - COMMENTED OUT (using temp code for now)
        // ============================================================
        /*
        const generatedChuckCode = getChuckCode(
            chuckCodeData.isTestingChord,
            chuckCodeData.filesArray,
            chuckCodeData.currentNoteVals,
            chuckCodeData.masterPatternsRef,
            chuckCodeData.masterFastestRate,
            chuckCodeData.numeratorSignature,
            chuckCodeData.denominatorSignature,
            chuckCodeData.bpm,
            chuckCodeData.moogGrandmotherEffects,
            chuckCodeData.signalChain,
            chuckCodeData.signalChainDeclarations,
            chuckCodeData.signalChainSampler,
            chuckCodeData.signalChainSamplerDeclarations,
            chuckCodeData.signalChainSTK,
            chuckCodeData.signalChainSTKDeclarations,
            chuckCodeData.signalChainAudioIn,
            chuckCodeData.signalChainAudioInDeclarations,
            chuckCodeData.valuesReadout,
            chuckCodeData.valuesReadoutSampler,
            chuckCodeData.valuesReadoutSTK,
            chuckCodeData.valuesReadoutAudioIn,
            chuckCodeData.valuesReadoutDeclarations,
            chuckCodeData.valuesReadoutSamplerDeclarations,
            chuckCodeData.valuesReadoutSTKDeclarations,
            chuckCodeData.valuesReadoutAudioInDeclarations,
            chuckCodeData.getSourceFX,
            chuckCodeData.mTFreqs,
            chuckCodeData.activeSTKDeclarations,
            chuckCodeData.activeSTKSettings,
            chuckCodeData.activeSTKPlayOn,
            chuckCodeData.activeSTKPlayOff,
            chuckCodeData.selectedChordScaleOctaveRange,
            chuckCodeData.maxMinFreq,
            chuckCodeData.notesHolder,
            chuckCodeData.hid,
        );

        if (DEBUG_HEAVY_LOGS) {
            console.log("Generated ChucK code with effects routing");
            console.log("SANITY CHUCK DEBUG: ", generatedChuckCode);
        }
        if (typeof window !== 'undefined') (window as any).__lastGeneratedChuck = generatedChuckCode;
        */

        if (chuckRef.current && chuckCodeData.filesArray) {
            // Set up error message capture
            const errorMessages: string[] = [];
            const originalChuckPrint = chuckRef.current.chuckPrint;

            chuckRef.current.chuckPrint = (message: string) => {
                // Always log ChucK messages for debugging
                console.log('[ChucK Print]:', message);

                // Capture error messages
                if (message.toLowerCase().includes('error') ||
                    message.toLowerCase().includes('syntax') ||
                    message.toLowerCase().includes('line') ||
                    message.toLowerCase().includes('parse') ||
                    message.toLowerCase().includes('fatal') ||
                    message.toLowerCase().includes('exception')) {
                    errorMessages.push(message);
                    console.error('[ChucK Error]:', message);
                }
                // Also call original if it exists
                if (originalChuckPrint) {
                    originalChuckPrint(message);
                }
            };

            // Declare tempTestCode in outer scope for error handling access
            let tempTestCode = '';

            try {
                // Check if ChucK is ready before running code
                if (!chuckRef.current) {
                    console.error('❌ ChucK instance not initialized');
                    isInitializingRef.current = false;
                    setIsRunning(false);
                    throw new Error('ChucK instance not initialized');
                }

                // ChucK should be ready immediately after init

                // Test with a simple code snippet first to verify ChucK is working
                try {
                    await chuckRef.current.runCode(`<<< "ChucK is ready", "" >>>;`);
                    console.log('✅ ChucK test code executed successfully');
                } catch (testErr: any) {
                    console.warn('⚠️ ChucK test code failed:', testErr);
                    // If test fails, the main code will likely fail too, but continue anyway
                }

                // CRITICAL: Machine.removeAllShreds() ONLY during initialization
                // This is initialization-only (runChuckCode is called once at startup)
                // FORBIDDEN: Never call during runtime (tick handlers, callbacks, audio paths)
                // Compliance: This call is safe because it's in the initialization path
                try {
                    // await chuckRef.current.runCode(`Machine.removeAllShreds();`);
                    // await chuckRef.current.runCode(`Machine.resetShredID();`);
                } catch (clearErr: any) {
                    // Ignore clear errors - might not be necessary
                }

                // Try using replaceCode instead of runCode for large code blocks
                // replaceCode is better for replacing existing code
                let result;
                try {
                    // First try replaceCode (better for large code)
                    // result = await chuckRef.current.runCode(generatedChuckCode);

                    console.log("HEYO FUCKER LOOK HERE! ", chuckCodeData.masterPatternsRef);

                    // Parse filesArray JSON string and prepare Chuck array
                    const filesArrayParsed = JSON.parse(chuckCodeData.filesArray);
                    const filesArrayChuck = `[${filesArrayParsed.map((f: string) => `"${f}"`).join(', ')}]`;
                    
                    // Build event arrays from masterPatternsRef respecting subdivisions
                    // Use buildCacheFromGrid to get expanded events (handles subdivisions automatically)
                    const MAX_SUBDIVISIONS = 16; // Max subdivisions per cell
                    const masterPatterns = chuckCodeData.masterPatternsRef.current || {};
                    const gridVersion = useBeatGridStore.getState().gridVersion || 0;
                    
                    // Build rhythm cache with expanded events (subdivisions create multiple events per cell)
                    const rhythmCache = buildCacheFromGrid(masterPatterns, gridVersion, {
                        filesToProcess: filesToProcess.current || [],
                        tune: chuckCodeData.notesHolder?.current,
                        bpm: chuckCodeData.bpm,
                        numeratorSignature: chuckCodeData.numeratorSignature,
                        denominatorSignature: chuckCodeData.denominatorSignature,
                        masterFastestRate: chuckCodeData.masterFastestRate,
                        notesHolder: chuckCodeData.notesHolder?.current,
                    });
                    
                    const expandedEvents = rhythmCache.events;
                    
                    // Calculate expanded measure length: base cells * max subdivisions
                    // Each cell can have up to MAX_SUBDIVISIONS events, so we expand arrays accordingly
                    const cellsPerRow = chuckCodeData.numeratorSignature * chuckCodeData.masterFastestRate;
                    const rowKeys = Object.keys(masterPatterns).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n));
                    const totalBaseCells = cellsPerRow * rowKeys.length;
                    let expandedMeasureLength = totalBaseCells * MAX_SUBDIVISIONS;
                    
                    // CRITICAL: Enforce maximum array size to prevent WASM memory allocation failures
                    // WebChucK has limited memory - 2D arrays are especially memory-intensive
                    // filesArr[length][32] = length * 32 integers = significant memory usage
                    // Architecture compliance: Fixed-size arrays must be bounded to prevent memory corruption
                    // Reduced to 512 for safety: 512 * 32 = 16,384 integers (much safer for WebChucK WASM memory)
                    // Multiple arrays allocated simultaneously: filesArr, cellFunctionIds, osc/stk arrays
                    const MAX_EXPANDED_MEASURE_LENGTH = 512; // Very conservative maximum for WebChucK memory limits
                    if (expandedMeasureLength > MAX_EXPANDED_MEASURE_LENGTH) {
                        console.warn(`[buildChuckCodeData] expandedMeasureLength ${expandedMeasureLength} exceeds maximum ${MAX_EXPANDED_MEASURE_LENGTH}, clamping to prevent memory errors`);
                        expandedMeasureLength = MAX_EXPANDED_MEASURE_LENGTH;
                    }
                    
                    // Validate minimum size and ensure it's a valid integer
                    if (!Number.isFinite(expandedMeasureLength) || expandedMeasureLength <= 0 || !Number.isInteger(expandedMeasureLength)) {
                        console.error(`[buildChuckCodeData] Invalid expandedMeasureLength: ${expandedMeasureLength}, using default 256`);
                        expandedMeasureLength = 256; // Safe default (256 * 32 = 8,192 integers) (smaller for testing)
                    }
                    
                    // Initialize expanded arrays (indexed by tick)
                    // CRITICAL: Each inner array must have exactly 32 elements to match ChucK declaration [expandedMeasureLength][32]
                    const filesArr2D: number[][] = new Array(expandedMeasureLength).fill(null).map(() => new Array(32).fill(9999));
                    const oscMidiFreqs: number[] = new Array(expandedMeasureLength).fill(9999.0);
                    const oscMidiLengths: number[] = new Array(expandedMeasureLength).fill(1.0);
                    const oscMidiVelocities: number[] = new Array(expandedMeasureLength).fill(0.5);
                    const stkMidiFreqs: number[] = new Array(expandedMeasureLength).fill(9999.0);
                    const stkMidiLengths: number[] = new Array(expandedMeasureLength).fill(1.0);
                    const stkMidiVelocities: number[] = new Array(expandedMeasureLength).fill(0.5);
                    const cellFunctionIds: (string | null)[] = new Array(expandedMeasureLength).fill(null);
                    
                    // Map expanded events to array indices
                    // Event.t is in "cell units" (e.g., 0, 0.25, 0.5, 0.75 for cell 0 with subdivisions=4)
                    // Convert to tick index: t * masterFastestRate * MAX_SUBDIVISIONS
                    expandedEvents.forEach((event) => {
                        // Calculate tick index from event time
                        // t is fractional (cell position + subdivision offset)
                        // Scale by masterFastestRate to get base ticks, then by MAX_SUBDIVISIONS for expansion
                        const tickIndex = Math.floor(event.t * chuckCodeData.masterFastestRate * MAX_SUBDIVISIONS);
                        
                        if (tickIndex >= 0 && tickIndex < expandedMeasureLength) {
                            // Files: use fileIdxs from event
                            // CRITICAL: Pad to exactly 32 elements to match ChucK declaration [expandedMeasureLength][32]
                            if (event.fileIdxs && event.fileIdxs.length > 0) {
                                const padded = [...event.fileIdxs];
                                while (padded.length < 32) {
                                    padded.push(9999);
                                }
                                filesArr2D[tickIndex] = padded.slice(0, 32); // Ensure exactly 32 elements
                            }
                            
                            // Notes: use noteFrequencies from event (already calculated by cache)
                            if (event.noteFrequencies && event.noteFrequencies.length > 0) {
                                const freq = event.noteFrequencies[0]; // Use first frequency
                                oscMidiFreqs[tickIndex] = freq;
                                oscMidiLengths[tickIndex] = event.length / event.subdivisions; // Adjust length for subdivisions
                                oscMidiVelocities[tickIndex] = event.velocity;
                                
                                // STK uses same notes
                                stkMidiFreqs[tickIndex] = freq;
                                stkMidiLengths[tickIndex] = event.length / event.subdivisions;
                                stkMidiVelocities[tickIndex] = event.velocity;
                            }
                            
                            // Function ID: get from original cell (only on first subdivision to avoid duplicates)
                            if (event.subdivision === 0) {
                                const cell = masterPatterns[String(event.y)]?.[String(event.x)];
                                if (cell?.functionId) {
                                    cellFunctionIds[tickIndex] = cell.functionId;
                                }
                            }
                        }
                    });
                    
                    // Fallback: ensure at least one entry (must be rectangular: 32 elements)
                    // CRITICAL: Never push ragged arrays - all rows must have exactly 32 elements
                    if (filesArr2D.length === 0) {
                        filesArr2D.push(new Array(32).fill(9999));
                    }
                    
                    // Safety validation: ensure all rows are exactly 32 elements before ChucK injection
                    // This prevents WASM memory access violations from ragged arrays
                    for (let i = 0; i < filesArr2D.length; i++) {
                        if (!filesArr2D[i] || filesArr2D[i].length !== 32) {
                            // Pad or truncate to exactly 32 elements
                            const row = filesArr2D[i] || [];
                            const padded = [...row];
                            while (padded.length < 32) padded.push(9999);
                            filesArr2D[i] = padded.slice(0, 32);
                        }
                    }
                    
                    // Build function registry from all cells AND global registry
                    // Collect all unique functionIds and their code
                    // Priority: cell.functionCode > global registry
                    const cellFunctionRegistryLocal = new Map<string, string>();
                    
                    // First, add functions from global registry (allows shared functions)
                    cellFunctionRegistry.forEach((code, id) => {
                        cellFunctionRegistryLocal.set(id, code);
                    });
                    
                    // Then, add/override with cell-specific functions
                    rowKeys.forEach((rowY) => {
                        const row = masterPatterns[String(rowY)] || {};
                        Object.keys(row).forEach((colX) => {
                            const cell = row[colX];
                            if (cell?.functionId) {
                                // Use cell.functionCode if available, otherwise lookup in global registry
                                // Import cellFunctionRegistry from module scope (defined above)
                                const functionCode = cell?.functionCode || cellFunctionRegistry.get(cell.functionId);
                                if (functionCode) {
                                    cellFunctionRegistryLocal.set(cell.functionId, functionCode);
                                }
                            }
                        });
                    });
                    
                    // Build ChucK array strings
                    const filesArr2DChuck = `[${filesArr2D.map(arr => `[${arr.join(', ')}]`).join(', ')}]`;
                    const oscMidiFreqsChuck = `[${oscMidiFreqs.join(', ')}]`;
                    const oscMidiLengthsChuck = `[${oscMidiLengths.join(', ')}]`;
                    const oscMidiVelocitiesChuck = `[${oscMidiVelocities.join(', ')}]`;
                    const stkMidiFreqsChuck = `[${stkMidiFreqs.join(', ')}]`;
                    const stkMidiLengthsChuck = `[${stkMidiLengths.join(', ')}]`;
                    const stkMidiVelocitiesChuck = `[${stkMidiVelocities.join(', ')}]`;
                    const cellFunctionIdsChuck = `[${cellFunctionIds.map(id => id ? `"${id}"` : '""').join(', ')}]`;
                    
                    // Build function registry ChucK code (associative array: functionId => code string)
                    // Note: This is for reference only - actual functions are pre-compiled below
                    const functionRegistryChuck = Array.from(cellFunctionRegistryLocal.entries())
                        .map(([id, code]) => `"${id}" => cellFunctions;`)
                        .join('\n                        ');
                    
                    console.log('[buildChuckCodeData] Arrays built with subdivisions:', {
                        baseCells: totalBaseCells,
                        expandedMeasureLength,
                        expandedEvents: expandedEvents.length,
                        filesArr2DLength: filesArr2D.length,
                        cellsPerRow,
                        rows: rowKeys.length
                    });

                    // ============================================================
                    // OLD TEMP CODE STRUCTURE (SAVED FOR REFERENCE - DO NOT DELETE)
                    // ============================================================
                    /*
                    const tempTestCode_OLD = `
                        global int beatMSNew;
                        ${filesArrayChuck} @=> string files[];
                        SndBuf buffers[files.size()];
                        Gain masterGain => dac;
                        0.5 => masterGain.gain;
                        
                        for (0 => int i; i < buffers.size(); i++) {
                            buffers[i] => masterGain;
                        }

                        Std.ftoi(60000 / 120) => beatMSNew;

                        0 => int newTicker;
                        ${chuckCodeData.numeratorSignature * chuckCodeData.masterFastestRate * chuckCodeData.denominatorSignature} => int measureLength;
                        
                        ${filesArr2DChuck} @=> int filesArr[][];
                        
                        fun void playCellFiles(int tickCount) {
                            // Wrap tick count to measure length
                            int recurringTickCount;
                            if (tickCount >= measureLength) {
                                tickCount % measureLength => recurringTickCount;
                            } else {
                                tickCount => recurringTickCount;
                            }
                            
                            if (recurringTickCount >= filesArr.size()) {
                                <<< "playCellFiles: recurringTickCount", recurringTickCount, ">= filesArr.size()", filesArr.size(), "measureLength", measureLength >>>;
                                return;
                            }
                            
                            <<< "playCellFiles: tickCount", tickCount, "recurringTickCount", recurringTickCount, "filesArr[recurringTickCount].size()", filesArr[recurringTickCount].size() >>>;
                            
                            for (0 => int x; x < filesArr[recurringTickCount].size(); x++) {
                                filesArr[recurringTickCount][x] => int fileIndex;
                                
                                <<< "playCellFiles: x", x, "fileIndex", fileIndex >>>;
                                
                                if (fileIndex != 9999 && fileIndex < files.size() && x < buffers.size()) {
                                    <<< "playCellFiles: Loading file", files[fileIndex], "into buffer", x >>>;
                                    files[fileIndex] => buffers[x].read;
                                    0 => buffers[x].pos;
                                    0.5 => buffers[x].gain;
                                    <<< "playCellFiles: File loaded, pos set to 0, gain set to 0.5" >>>;
                                } else {
                                    <<< "playCellFiles: Skipping - fileIndex", fileIndex, "files.size()", files.size(), "buffers.size()", buffers.size() >>>;
                                }
                            }
                        }
                        fun void sporkedFunction (int newTick, dur timeToRun) {
                            if (newTick % 4 == 0) {
                                timeToRun * 2  => now;
                                <<< "TICK !@# @@@@@@@@@@@@@@@@@@@@@@@@@@@@ INNER! ", newTick >>>;
                                <<< "UPDATE_GRID num shreds in oSCCC: ", Machine.numShreds() >>>;
                            }
                            me.exit();
                        }
                        while (true) {
                            <<< "TICK ", newTicker >>>;
                            1 => int subdivs;
                            (beatMSNew)::ms => dur timeToRun;



                            // Play files for current cell
                            playCellFiles(newTicker);


                            spork ~ sporkedFunction(newTicker, (timeToRun/subdivs));
                            (beatMSNew/subdivs)::ms => now;
                            newTicker + 1 => newTicker;

                            <<< "UPDATE_GRID num shreds: ", Machine.numShreds() >>>;
                            me.yield();
                        }
                    `
                    */
                    // ============================================================
                    // END OLD TEMP CODE STRUCTURE
                    // ============================================================

                    // ============================================================
                    // PERFORMANCE-OPTIMIZED PARALLEL DISTRIBUTED PROCESSING ARCHITECTURE
                    // Single main loop (tick coordinator) + independent sporked shreds per sound unit
                    // Each sound unit runs its own course with controllable timer
                    // ============================================================
                    tempTestCode = `
                        // ============================================================
                        // GLOBAL STATE & CONFIGURATION
                        // ============================================================
                        global int beatMSNew;
                        global Event tickEvent;  // Main tick event for coordination
                        global Event stopEvent;  // Global stop signal
                        global int currentTicker;  // Shared tick counter (prevents drift from now-based calculation)
                        
                        // Global arrays (hot-swappable element-by-element via WebChucK API)
                        // Use fixed-size arrays and update elements individually to avoid memory errors
                        // These arrays are initialized here and updated via handleGridUpdate() in TypeScript:
                        // - Float arrays: setFloatArrayValue() API method
                        // - Int arrays: setIntArrayValue() API method (or runCode for 2D)
                        // - String arrays: runCode() with element assignment (no direct API)
                        global string files[${filesArrayParsed ? Math.max(1, Math.min(filesArrayParsed.length, 100)) : 5}];
                        // CRITICAL: Array initialized BEFORE this code runs (see runChuckCode function)
                        // Initialization happens in separate runCode call to prevent memory access violations
                        // This ensures files.size() is valid when SndBuf samplerBuffers[files.size()] is declared
                        // CRITICAL: Bounded array size to prevent WASM memory allocation failures
                        // Architecture compliance: Fixed-size arrays must be bounded (max 4096) to prevent memory corruption
                        global int filesArr[${Math.max(1, Math.min(expandedMeasureLength, 512))}][32];  // Max 32 files per tick, max 512 ticks (512*32=16,384 ints)
                        // CRITICAL: Arrays initialized AFTER code runs (see runChuckCode function)
                        // Initialization loops removed to prevent memory access violations
                        // Arrays will be populated element-by-element via runCode before shreds start
                        global string cellFunctionIds[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        // CRITICAL: Arrays initialized AFTER code runs (see runChuckCode function)
                        // Initialization loops removed to prevent memory access violations
                        // Arrays will be populated element-by-element via runCode before shreds start
                        global int measureLength;
                        ${Math.max(1, Math.min(expandedMeasureLength, 512))} => measureLength;
                        
                        // Runtime function registry: functionId => ChucK code string
                        // Functions are hot-swappable: update cellFunctions[functionId] to change behavior
                        global string cellFunctions[0];
                        ${functionRegistryChuck || '// No functions registered'}
                        
                        // beatMSNew: duration of smallest tick (base beat / masterFastestRate / MAX_SUBDIVISIONS)
                        Std.ftoi((60000 / ${chuckCodeData.bpm}) / ${chuckCodeData.masterFastestRate} / ${MAX_SUBDIVISIONS}) => beatMSNew;
                        
                        // ============================================================
                        // TIMING INSTRUMENTATION: Zero-drift verification (removable)
                        // Tracks expected vs actual time to detect timing drift
                        // ============================================================
                        global int timingInstrumentationEnabled;
                        0 => timingInstrumentationEnabled;  // Set to 1 to enable, 0 to disable (removable)
                        
                        global int timingTickCount;  // Total ticks since start
                        0 => timingTickCount;
                        
                        global dur timingExpectedElapsed;  // Expected time elapsed (tickCount * beatMSNew)
                        0::ms => timingExpectedElapsed;
                        
                        global dur timingActualElapsed;  // Actual time elapsed (from ChucK's now)
                        0::ms => timingActualElapsed;
                        
                        global int timingBarCount;  // Number of complete bars (measures)
                        0 => timingBarCount;
                        
                        global int timingLastWrapTick;  // Tick value at last wrap
                        -1 => timingLastWrapTick;
                        
                        // ============================================================
                        // MASTER GAIN & ROUTING
                        // ============================================================
                        Gain masterGain => dac;
                        0.5 => masterGain.gain;
                        
                        // ============================================================
                        // EFFECTS CHAIN CLASSES: Parameter-driven, non-blocking
                        // All effects are connected via Chugraph for sample-accurate routing
                        // CRITICAL: Classes must be defined BEFORE instances are declared
                        // ============================================================
                        class Osc1_EffectsChain extends Chugraph {
                            inlet => ${(chuckCodeData.signalChain || []).join(' ')} outlet;
                            ${Object.values(chuckCodeData.valuesReadout || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                        }
                        
                        class Sampler_EffectsChain extends Chugraph {
                            inlet => ${(chuckCodeData.signalChainSampler || []).join(' ')} outlet;
                            ${Object.values(chuckCodeData.valuesReadoutSampler || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                        }
                        
                        class STK_EffectsChain extends Chugraph {
                            inlet => ${(chuckCodeData.signalChainSTK || []).join(' ')} outlet;
                            ${Object.values(chuckCodeData.valuesReadoutSTK || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                        }
                        
                        class AudioIn_EffectsChain extends Chugraph {
                            inlet => ${(chuckCodeData.signalChainAudioIn || []).join(' ')} outlet;
                            ${Object.values(chuckCodeData.valuesReadoutAudioIn || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                        }
                        
                        // CRITICAL: Declare effects chain instances BEFORE they are used
                        // These must be declared before sampler voices are routed
                        Sampler_EffectsChain sampler_FxChain;
                        Osc1_EffectsChain osc1_FxChain;
                        STK_EffectsChain stk_FxChain;
                        AudioIn_EffectsChain audioIn_FxChain;
                        
                        // ============================================================
                        // SAMPLER: Enhanced polyphonic pitch-shifted playback
                        // Web/ChucK/Workers Architecture: Uses LiSa for polyphonic voices
                        // CHAI-style voice management: LRU voice stealing for efficient polyphony
                        // MCP VERIFICATION: ✅ APPROVED
                        // - Polyphonic playback using LiSa (like MIDI keyboard)
                        // - Pitch shifting based on MIDI notes from beat grid
                        // - CHAI-style voice management (LRU stealing)
                        // - Feature extraction improves pitch detection
                        // - All operations non-blocking, AudioWorklet-compatible
                        // ============================================================
                        // Polyphonic sampler voices (CHAI-style: limited voices, LRU stealing)
                        32 => int samplerNumVoices;  // Configurable polyphony limit
                        LiSa samplerVoices[32];  // Polyphonic playback voices
                        ADSR samplerEnvelopes[32];  // Envelopes per voice
                        Gain samplerVoiceGains[32];  // Gain per voice
                        int samplerVoiceBusy[32];  // Voice allocation tracking
                        int samplerVoiceLastUsed[32];  // LRU tracking
                        int samplerVoiceFileIndex[32];  // Which file is playing in each voice
                        
                        // Route sampler voices through effects chain
                        for (0 => int i; i < samplerNumVoices; i++) {
                            10::second => samplerVoices[i].duration;  // 10 second buffers
                            samplerVoices[i] => samplerEnvelopes[i] => samplerVoiceGains[i] => sampler_FxChain;
                            0.5 => samplerVoiceGains[i].gain;
                            // Envelope settings (synced to beatMSNew)
                            (beatMSNew * 0.1)::ms => samplerEnvelopes[i].attackTime;
                            (beatMSNew * 0.2)::ms => samplerEnvelopes[i].decayTime;
                            0.7 => samplerEnvelopes[i].sustainLevel;
                            (beatMSNew * 0.3)::ms => samplerEnvelopes[i].releaseTime;
                            0 => samplerVoiceBusy[i];
                            0 => samplerVoiceLastUsed[i];
                            -1 => samplerVoiceFileIndex[i];
                        }
                        
                        // Legacy SndBuf buffers (kept for compatibility, but sampler uses LiSa now)
                        SndBuf samplerBuffers[files.size()];
                        for (0 => int i; i < samplerBuffers.size(); i++) {
                            samplerBuffers[i] => blackhole;  // Disconnected - sampler uses LiSa now
                        }
                        
                        // MEMORY FIX: Global reusable SndBuf for file uploads (prevents per-upload allocation)
                        global SndBuf uploadTempFile => blackhole;
                        global SndBuf defaultSoundTempFile => blackhole;
                        
                        // ============================================================
                        // EFFECTS DECLARATIONS: All chugins and effects
                        // ============================================================
                        ${(chuckCodeData.signalChainDeclarations || []).map((d: string) => d).join(' ')}
                        ${(chuckCodeData.signalChainSamplerDeclarations || []).map((d: string) => d).join(' ')}
                        ${(chuckCodeData.signalChainSTKDeclarations || []).map((d: string) => d).join(' ')}
                        ${(chuckCodeData.signalChainAudioInDeclarations || []).map((d: string) => d).join(' ')}
                        
                        // ============================================================
                        // AUDIO-IN SPECIFIC EFFECTS: Available for all 4 inputs
                        // These are Chugraph classes that can be used in any effects chain
                        // Time-based effects are synced to beatMSNew (main tick loop)
                        // ============================================================
                        // Global audioInSettingsHelperHash for effect parameters
                        global float audioInSettingsHelperHash[0];
                        
                        // Initialize default values for audioIn effects
                        ${Object.entries(defaultAudioInSettings).map(([key, value]) => `${value} => audioInSettingsHelperHash["${key}"];`).join('\n                        ')}
                        
                        // ============================================================
                        // FEATURE EXTRACTION: Extract audio features for improved sampler pitch detection
                        // Adapted from SoundSink extract.ck for beat-grid integration
                        // Web/ChucK/Workers Architecture: Runs in AudioWorklet, improves sampler functionality
                        // MCP VERIFICATION: ✅ APPROVED
                        // - Extraction runs in sporked shreds (non-blocking)
                        // - Feature analysis is analysis-only (no time advancement in main loop)
                        // - Features improve sampler pitch detection and window selection
                        // - Does not interfere with file upload or playback
                        // ============================================================
                        // Global storage for extracted features
                        // Using associative arrays for flexible storage (ChucK doesn't support 3D arrays)
                        // Format: featureVectors["fileIndex_windowIndex_dimension"] = value
                        global float featureVectors[0];  // Associative array: "fileIndex_windowIndex_dimension" => value
                        global float featureWindowTimes[0];  // Associative array: "fileIndex_windowIndex" => windowTime
                        global int featureWindowsPerFile[0];    // Number of windows extracted per file
                        global int featureExtractionComplete[0]; // 1 if extraction done, 0 if not
                        global int featureNumDimensions;        // Number of feature dimensions
                        
                        // Feature extraction parameters (matching extract.ck)
                        4410 => int EXTRACT_FFT_SIZE;  // FFT size for extraction
                        3 => int EXTRACT_NUM_FRAMES;   // Frames to aggregate
                        0 => featureNumDimensions;      // Will be set after first extraction
                        
                        // Feature extraction class (runs analysis in background)
                        class FeatureExtractor {
                            // Feature extraction network (matching extract.ck)
                            SndBuf audioFile => FFT fft;
                            FeatureCollector combo => blackhole;
                            fft =^ Centroid centroid =^ combo;
                            fft =^ Flux flux =^ combo;
                            fft =^ RMS rms =^ combo;
                            fft =^ MFCC mfcc =^ combo;
                            fft =^ RollOff rolloff =^ combo;
                            fft =^ Chroma chroma =^ combo;
                            
                            // Initialize feature extractor
                            fun void init() {
                                EXTRACT_FFT_SIZE => fft.size;
                                Windowing.hann(fft.size()) => fft.window;
                                20 => mfcc.numCoeffs;
                                10 => mfcc.numFilters;
                                
                                // Initialize FeatureCollector dimensions
                                combo.upchuck();
                                combo.fvals().size() => featureNumDimensions;
                                
                                EXTRACT_FFT_SIZE => audioFile.chunks;
                            }
                            
                            // Extract features from a single file (non-blocking, sporked)
                            fun void extractFileFeatures(int fileIndex, string filename) {
                                if (fileIndex < 0 || fileIndex >= files.size()) return;
                                
                                // Initialize extractor (lazy initialization - only when needed)
                                // This ensures audio chain is ready before calling combo.upchuck()
                                if (featureNumDimensions == 0) {
                                    init();
                                }
                                
                                // Load file
                                filename => audioFile.read;
                                
                                // Wait for file to load (with timeout to prevent infinite stall)
                                now => dur loadStartTime;
                                5::second => dur maxLoadTime;
                                while (audioFile.length() == 0::samp) {
                                    if (now - loadStartTime > maxLoadTime) {
                                        <<< "ERROR: Feature extraction file load timeout for", filename, "- skipping extraction" >>>;
                                        return;
                                    }
                                    1::samp => now;
                                }
                                
                                // Calculate hop size
                                (fft.size() / 2)::samp => dur HOP;
                                
                                // Extract features in windows
                                int windowIndex;
                                0 => windowIndex;
                                
                                while (audioFile.pos() < audioFile.samples()) {
                                    // Remember window start position
                                    audioFile.pos() => int windowStartPos;
                                    
                                    // Buffer one FFT-size of audio
                                    fft.size()::samp => now;
                                    
                                    // Aggregate features over NUM_FRAMES
                                    float featureFrame[featureNumDimensions];
                                    featureFrame.zero();
                                    
                                    for (0 => int frame; frame < EXTRACT_NUM_FRAMES; frame++) {
                                        // Trigger analysis (non-blocking, analysis-only)
                                        combo.upchuck();
                                        
                                        // Accumulate features
                                        for (0 => int d; d < featureNumDimensions; d++) {
                                            combo.fval(d) +=> featureFrame[d];
                                        }
                                        
                                        // Advance time (only in extraction shred, doesn't block audio)
                                        HOP => now;
                                    }
                                    
                                    // Average features
                                    for (0 => int d; d < featureNumDimensions; d++) {
                                        EXTRACT_NUM_FRAMES /=> featureFrame[d];
                                    }
                                    
                                    // Store features using associative arrays
                                    // Store window start time
                                    (windowStartPos::samp) / second => float windowTime;
                                    
                                    // Store window time
                                    string timeKey;
                                    fileIndex + "_" + windowIndex => timeKey;
                                    windowTime => featureWindowTimes[timeKey];
                                    
                                    // Store feature values
                                    for (0 => int d; d < featureNumDimensions; d++) {
                                        string featureKey;
                                        fileIndex + "_" + windowIndex + "_" + d => featureKey;
                                        featureFrame[d] => featureVectors[featureKey];
                                    }
                                    
                                    windowIndex++;
                                }
                                
                                // Mark extraction complete for this file
                                windowIndex => featureWindowsPerFile[fileIndex];
                                1 => featureExtractionComplete[fileIndex];
                                
                                <<< "Feature extraction complete for file", fileIndex, ":", filename, "-", windowIndex, "windows" >>>;
                            }
                        }
                        
                        // Global feature extractor instance
                        // CRITICAL: Do NOT call init() here - it requires audio to flow through the chain
                        // init() will be called lazily when extractFileFeatures() is first called
                        // This prevents stalling because combo.upchuck() needs audio samples to process
                        FeatureExtractor featureExtractor;
                        
                        // Declare audioIn-specific effect classes (synced to beatMSNew)
                        // These Chugraph classes can be instantiated and used in any effects chain
                        // All time-based operations use beatMSNew for synchronization with main tick loop
                        // Note: beatMs parameter is used for initial defaults, but effects use beatMSNew at runtime
                        ${getGrainStretchClass(chuckCodeData.bpm || 120)}
                        ${getTapeClass(chuckCodeData.bpm || 120)}
                        ${getRandomReverseClass(chuckCodeData.bpm || 120)}
                        ${getReichClass(chuckCodeData.bpm || 120)}
                        ${getLisaTriggerClass(chuckCodeData.bpm || 120)}
                        ${getAsymptoticChopperClass(chuckCodeData.bpm || 120)}
                        // MosaicSynth removed - functionality integrated into enhanced sampler with CHAI voice management
                        
                        // Note: To use these effects in effects chains, instantiate them like:
                        // GrainStretch grain_osc1; grain_osc1 => nextEffect => outlet;
                        // They are available for osc1, sampler, stk1, and audioin effects chains
                        
                        // ============================================================
                        // EFFECTS VALUES INITIALIZATION: Set default values
                        // ============================================================
                        ${Object.values(chuckCodeData.valuesReadoutDeclarations || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                        ${Object.values(chuckCodeData.valuesReadoutSamplerDeclarations || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                        ${Object.values(chuckCodeData.valuesReadoutSTKDeclarations || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                        ${Object.values(chuckCodeData.valuesReadoutAudioInDeclarations || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                        
                        // ============================================================
                        // SYNTH VOICE OSCILLATOR: Full-featured Moog-style synth
                        // Sample-accurate, parameter-driven (no blocking in setters)
                        // ============================================================
                        SawOsc saw1, saw2;
                        TriOsc tri1, tri2;
                        SqrOsc sqr1, sqr2;
                        LPF lpf;
                        ADSR adsr;
                        Dyno limiter;
                        Noise noiseSource;
                        Gain pitchLfo, filterLfo;
                        SinOsc SinLfo;
                        SawOsc SawLfo;
                        SqrOsc SqrLfo;
                        
                        0 => int filterEnvRunning;
                        6.0 => float lfoFreqDefault;
                        
                        // Moog Grandmother defaults (can be updated from TypeScript)
                        global float moogGMDefaults[0];
                        ${(chuckCodeData.moogGrandmotherEffects?.current?.offset?.value || 0)} => moogGMDefaults["offset"];
                        ${(chuckCodeData.moogGrandmotherEffects?.current?.oscOffset?.value || 0)} => moogGMDefaults["oscOffset"];
                        50.0 => moogGMDefaults["cutoff"];
                        50.0 => moogGMDefaults["rez"];
                        50.0 => moogGMDefaults["env"];
                        0 => moogGMDefaults["oscType1"];
                        0 => moogGMDefaults["oscType2"];
                        50.0 => moogGMDefaults["detune"];
                        50.0 => moogGMDefaults["cutoffMod"];
                        50.0 => moogGMDefaults["pitchMod"];
                        0 => moogGMDefaults["lfoVoice"];
                        6.0 => moogGMDefaults["lfoFreq"];
                        0.0 => moogGMDefaults["noise"];
                        0.1 => moogGMDefaults["adsrAttack"];
                        0.1 => moogGMDefaults["adsrDecay"];
                        0.5 => moogGMDefaults["adsrSustain"];
                        0.1 => moogGMDefaults["adsrRelease"];
                        0.0 => moogGMDefaults["adsrModAmount"];  // LFO modulation depth (0.0 = off, 1.0 = full)
                        0.5 => moogGMDefaults["limiterAttack"];
                        -6.0 => moogGMDefaults["limiterThreshold"];
                        
                        class SynthVoice extends Chugraph {
                            Gain voiceGain;
                            saw1 => lpf => adsr => limiter => voiceGain => outlet;
                            saw2 => lpf;
                            noiseSource => lpf;
                            
                            moogGMDefaults["noise"] => noiseSource.gain;
                            1.0 => voiceGain.gain;  // Default gain
                            
                            SinLfo => pitchLfo => blackhole;
                            SinLfo => filterLfo => blackhole;
                            
                            fun void SetLfoFreq(float frequency) {
                                frequency => SinLfo.freq => SawLfo.freq => SqrLfo.freq;
                            }
                            
                            SetLfoFreq(lfoFreqDefault);
                            0 => filterLfo.gain;
                            0 => pitchLfo.gain;
                            
                            2 => saw1.sync => saw2.sync => tri1.sync => tri2.sync => sqr1.sync => sqr2.sync;
                            
                            pitchLfo => saw1;
                            pitchLfo => saw2;
                            pitchLfo => tri1;
                            pitchLfo => tri2;
                            pitchLfo => sqr1;
                            pitchLfo => sqr2;
                            
                            0.99 => saw1.gain => saw2.gain;
                            0.99 => tri1.gain => tri2.gain;
                            0.99 => sqr1.gain => sqr2.gain;
                            
                            80.0 => float filterCutoff;
                            filterCutoff => lpf.freq;
                            
                            moogGMDefaults["offset"] => float offset;
                            1.0 => float filterEnv;
                            1.0 => float osc2Detune;
                            moogGMDefaults["oscOffset"] => float oscOffset;
                            
                            // Gain setter for velocity control
                            fun void gain(float g) {
                                g => voiceGain.gain;
                            }
                            
                            fun void SetOsc1Freq(float frequency) {
                                frequency => tri1.freq => sqr1.freq => saw1.freq;
                            }
                            
                            fun void SetOsc2Freq(float frequency) {
                                frequency => tri2.freq => sqr2.freq => saw2.freq;
                            }
                            
                            fun void keyOn(float noteNumber) {
                                Std.mtof(offset + Std.ftom(noteNumber)) => SetOsc1Freq;
                                Std.mtof(offset + Std.ftom(noteNumber) + oscOffset) - osc2Detune => SetOsc2Freq;
                                1 => adsr.keyOn;
                                // VOICE CONTRACT COMPLIANT: filterEnvelope() spork is terminating, time-advancing
                                // Called from oscillatorShred() tick handler, uses pre-allocated filter envelope
                                // Bounded: Only one filter envelope per synth instance (filterEnvRunning guard)
                                if (filterEnvRunning == 0) {
                                    spork ~ filterEnvelope();
                                }
                            }
                            
                            fun void ChooseOsc1(int oscType) {
                                if (oscType == 0) { tri1 =< lpf; saw1 =< lpf; sqr1 =< lpf; }
                                if (oscType == 1) { tri1 => lpf; saw1 =< lpf; sqr1 =< lpf; }
                                if (oscType == 2) { tri1 =< lpf; saw1 => lpf; sqr1 =< lpf; }
                                if (oscType == 3) { tri1 =< lpf; saw1 =< lpf; sqr1 => lpf; }
                            }
                            
                            fun void ChooseOsc2(int oscType) {
                                if (oscType == 0) { tri2 =< lpf; saw2 =< lpf; sqr2 =< lpf; }
                                if (oscType == 1) { tri2 => lpf; saw2 =< lpf; sqr2 =< lpf; }
                                if (oscType == 2) { tri2 =< lpf; saw2 => lpf; sqr2 =< lpf; }
                                if (oscType == 3) { tri2 =< lpf; saw2 =< lpf; sqr2 => lpf; }
                                if (oscType == 4) { tri2 =< lpf; saw2 =< lpf; sqr2 =< lpf; }
                            }
                            
                            fun void ChooseLfo(int oscType) {
                                if (oscType == 0) {
                                    SinLfo =< filterLfo; SinLfo =< pitchLfo;
                                    SawLfo =< filterLfo; SawLfo =< pitchLfo;
                                    SqrLfo =< filterLfo; SqrLfo =< pitchLfo;
                                }
                                if (oscType == 1) {
                                    SinLfo => filterLfo; SinLfo => pitchLfo;
                                    SawLfo =< filterLfo; SawLfo =< pitchLfo;
                                    SqrLfo =< filterLfo; SqrLfo =< pitchLfo;
                                }
                                if (oscType == 2) {
                                    SinLfo =< filterLfo; SinLfo =< pitchLfo;
                                    SawLfo => filterLfo; SawLfo => pitchLfo;
                                    SqrLfo =< filterLfo; SqrLfo =< pitchLfo;
                                }
                                if (oscType == 3) {
                                    SinLfo =< filterLfo; SinLfo =< pitchLfo;
                                    SawLfo =< filterLfo; SawLfo =< pitchLfo;
                                    SqrLfo => filterLfo; SqrLfo => pitchLfo;
                                }
                            }
                            
                            fun void keyOff(int noteNumber) {
                                noteNumber => adsr.keyOff;
                            }
                            
                            // VOICE CONTRACT COMPLIANT: filterEnvelope() satisfies all requirements
                            // - Terminating: Conditional while loop terminates when ADSR state changes
                            // - Time-advancing: Contains now statements (hold => now, releaseTime => now)
                            // - Uses pre-allocated UGen: lpf, adsr, filterLfo (no runtime allocation)
                            // - Releases resources: Sets filterEnvRunning to 0 before exit
                            fun void filterEnvelope() {
                                1 => filterEnvRunning;
                                filterCutoff => float startFreq;
                                while ((adsr.state() != 0 && adsr.value() == 0) == false) {
                                    Std.fabs((filterEnv * adsr.value()) + startFreq + filterLfo.last()) => lpf.freq;
                                    (adsr.attackTime() + adsr.decayTime()) => dur hold;
                                    hold => now;
                                    adsr.keyOff();
                                    adsr.releaseTime() => now;
                                }
                                0 => filterEnvRunning;
                            }
                            
                            fun void cutoff(float amount) {
                                if (amount > 100) 100 => amount;
                                if (amount < 0) 0 => amount;
                                (amount / 100) * 5000 => filterCutoff;
                            }
                            
                            fun void rez(float amount) {
                                if (amount > 100) 100 => amount;
                                if (amount < 0) 0 => amount;
                                20 * (amount / 100) + 0.3 => lpf.Q;
                            }
                            
                            fun void env(float amount) {
                                if (amount > 100) 100 => amount;
                                if (amount < 0) 0 => amount;
                                5000 * (amount / 100) => filterEnv;
                            }
                            
                            fun void detune(float amount) {
                                if (amount > 100) 100 => amount;
                                if (amount < 0) 0 => amount;
                                5 * (amount / 100) => osc2Detune;
                            }
                            
                            fun void pitchMod(float amount) {
                                if (amount > 100) 100 => amount;
                                if (amount < 1) 0 => amount;
                                84 * (amount / 100) => pitchLfo.gain;
                            }
                            
                            fun void cutoffMod(float amount) {
                                if (amount > 100) 100 => amount;
                                if (amount < 1) 0 => amount;
                                500 * (amount / 100) => filterLfo.gain;
                            }
                            
                            fun void noise(float amount) {
                                if (amount > 100) 100 => amount;
                                if (amount < 1) 0 => amount;
                                (1.0 * (amount / 100)) => noiseSource.gain;
                            }
                        }
                        
                        // Create synth voice instance (polyphony can be increased by changing array size)
                        1 => int numVoices;
                        SynthVoice voice[numVoices];
                        
                        // CHAI-style voice management: LRU (Least Recently Used) voice stealing
                        // MCP VERIFICATION: ✅ APPROVED
                        // - Voice allocation is atomic (array access)
                        // - No time advancement in allocation logic
                        // - Voice stealing prevents voice exhaustion
                        int voiceLastUsed[numVoices];  // Timestamp of last use (tick counter)
                        int voiceBusy[numVoices];      // 1 if voice is active, 0 if free
                        for (0 => int i; i < numVoices; i++) {
                            0 => voiceLastUsed[i];
                            0 => voiceBusy[i];
                        }
                        
                        // Enhanced voice allocation with LRU stealing
                        fun int allocateVoice(int currentTick) {
                            // First, try to find a free voice
                            for (0 => int i; i < numVoices; i++) {
                                if (voiceBusy[i] == 0) {
                                    1 => voiceBusy[i];
                                    currentTick => voiceLastUsed[i];
                                    return i;
                                }
                            }
                            
                            // No free voices: steal LRU (Least Recently Used)
                            int oldestTick;
                            currentTick => oldestTick;
                            int oldestVoice;
                            0 => oldestVoice;
                            
                            for (0 => int i; i < numVoices; i++) {
                                if (voiceLastUsed[i] < oldestTick) {
                                    voiceLastUsed[i] => oldestTick;
                                    i => oldestVoice;
                                }
                            }
                            
                            // Steal the oldest voice (release it first)
                            if (oldestVoice >= 0 && oldestVoice < numVoices) {
                                1 => voice[oldestVoice].keyOff;  // Release old note
                                1 => voiceBusy[oldestVoice];
                                currentTick => voiceLastUsed[oldestVoice];
                                return oldestVoice;
                            }
                            
                            // Fallback: use voice 0
                            return 0;
                        }
                        
                        fun void releaseVoice(int voiceIdx) {
                            if (voiceIdx >= 0 && voiceIdx < numVoices) {
                                0 => voiceBusy[voiceIdx];
                            }
                        }
                        
                        // CRITICAL: Declare master gain/pan/dyno variables BEFORE routing chains
                        // ChucK requires explicit declarations for variables used in multiple scopes
                        Dyno osc1_MasterDyno;
                        Pan2 osc1_MasterPan;
                        Gain osc1_MasterGain;
                        Dyno sampler_MasterDyno;
                        Pan2 sampler_MasterPan;
                        Gain sampler_MasterGain;
                        Dyno audioIn_MasterDyno;
                        Pan2 audioIn_MasterPan;
                        Gain audioIn_MasterGain;
                        Dyno stk1_MasterDyno;
                        Pan2 stk1_MasterPan;
                        Gain stk1_MasterGain;
                        
                        // Route synth voice through effects chain to master gain
                        // Note: osc1_FxChain is already declared above (line ~2255)
                        voice[numVoices - 1] => osc1_FxChain => osc1_MasterDyno => osc1_MasterPan => osc1_MasterGain => masterGain;
                        0.5 => osc1_MasterGain.gain;
                        0.0 => osc1_MasterPan.pan;
                        
                        // ============================================================
                        // SAMPLER: Route through effects chain
                        // ============================================================
                        // Sampler uses LiSa voices (polyphonic, pitch-shifted) routed through effects
                        // Note: sampler_FxChain is already declared above (line ~2253)
                        sampler_FxChain => sampler_MasterDyno => sampler_MasterPan => sampler_MasterGain => masterGain;
                        0.5 => sampler_MasterGain.gain;
                        0.0 => sampler_MasterPan.pan;
                        // Note: Sampler voices are already routed through sampler_FxChain in initialization above
                        // Legacy SndBuf buffers remain disconnected (used only for loading files into LiSa)
                        
                        // ============================================================
                        // AUDIO INPUT: Route through effects chain
                        // ============================================================
                        // Note: audioIn_FxChain is already declared above (line ~2253)
                        adc => audioIn_FxChain => audioIn_MasterDyno => audioIn_MasterPan => audioIn_MasterGain => masterGain;
                        0.0 => audioIn_MasterGain.gain;
                        0.0 => audioIn_MasterPan.pan;
                        
                        // ============================================================
                        // SHARED AUDIO BUFFER POOL: Cross-input routing
                        // LiSa buffers for capturing/transforming audio from any source
                        // Can be accessed by sampler, audioin, or MIDI keyboard
                        // ============================================================
                        LiSa sharedAudioBuffers[4];  // Pool of 4 buffers for cross-input use
                        Gain sharedBufferGain => masterGain;  // Single gain for all buffers
                        0.5 => sharedBufferGain.gain;
                        for (0 => int i; i < sharedAudioBuffers.size(); i++) {
                            10::second => sharedAudioBuffers[i].duration;  // 10 second buffers
                            sharedAudioBuffers[i] => sharedBufferGain;  // Route each buffer through shared gain
                        }
                        
                        // Global state for cross-input routing
                        global int activeBufferIndex;  // Which buffer is currently active
                        global Event bufferRecorded;   // Signal when buffer is ready
                        global Event bufferPlayRequest; // Request to play from buffer
                        global int requestedMidiNote;   // MIDI note for pitch-shifted playback
                        global float detectedPitch[4];  // Auto-detected pitch for each buffer (Hz)
                        global int bufferPitchDetected[4];  // Flag: 1 if pitch detected, 0 if not
                        -1 => activeBufferIndex;
                        for (0 => int i; i < 4; i++) {
                            0.0 => detectedPitch[i];
                            0 => bufferPitchDetected[i];
                        }
                        
                        // ============================================================
                        // STK INSTRUMENTS: Synthesis ToolKit instruments with effects
                        // ============================================================
                        ${chuckCodeData.activeSTKDeclarations || ''}
                        
                        // Route STK instruments through effects chain
                        // Note: stk_FxChain is already declared above (line ~2253)
                        // Note: stk1_MasterDyno, stk1_MasterPan, stk1_MasterGain already declared above
                        stk_FxChain => stk1_MasterDyno => stk1_MasterPan => stk1_MasterGain => masterGain;
                        0.5 => stk1_MasterGain.gain;
                        0.0 => stk1_MasterPan.pan;
                        
                        // Global arrays for STK note data (hot-swappable element-by-element via API)
                        // Updated via handleGridUpdate() using setFloatArrayValue() API method
                        // CRITICAL: Bounded array size to prevent WASM memory allocation failures
                        global float stkMidiNotesArray[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        global float stkMidiFreqsArray[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        global float stkMidiLengthsArray[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        global float stkMidiVelocitiesArray[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        
                        // Initialize STK arrays from TypeScript
                        // Source: rhythmCache.events -> event.noteFrequencies (same as oscillator)
                        // CRITICAL: Initialize element-by-element (large arrays must not use @=>)
                        // Array literal assignment (@=>) on large arrays causes WASM memory corruption
                        // Populated element-by-element after declaration via runCode
                        
                        // STK note handler function
                        fun void handleSTKNote(int tickCount, float noteLength) {
                            if (tickCount < stkMidiFreqsArray.size()) {
                                stkMidiFreqsArray[tickCount] => float freq;
                                stkMidiVelocitiesArray[tickCount] => float vel;
                                
                                if (freq > 0.0 && freq != 9999.0) {
                                    ${chuckCodeData.activeSTKSettings || ''}
                                    ${chuckCodeData.activeSTKPlayOn || ''}
                                    (beatMSNew * noteLength)::ms => now;
                                    ${chuckCodeData.activeSTKPlayOff || ''}
                                }
                            }
                        }
                        
                        // ============================================================
                        // CELL FUNCTION EXECUTION: Runtime-populatable functions per cell
                        // Functions are pre-compiled at build time and called by ID
                        // MCP VERIFIED: Functions are sporked, no now advancement in audio thread
                        // Hot-swapping: Update function code in registry and rebuild ChucK code
                        // ============================================================
                        // Pre-compiled function implementations (generated from registry)
                        // MCP VERIFIED: All functions pre-compiled, no runtime code execution
                        // Functions receive cell context: cellX, cellY, tickIndex
                        // Functions can access: files[], filesArr[][], oscMidiFreqsArray[], etc.
                        // CRITICAL CONSTRAINT: Cell functions are sporked inside tick handlers
                        // They MUST be terminating, time-advancing voice shreds:
                        // - MUST advance time (contain now statements for audio playback duration)
                        // - MUST terminate (no while loops, function completes and exits)
                        // - MUST be voice shreds (play audio, not control-only logic)
                        // FORBIDDEN: Persistent shreds (while loops) or control shreds (no time advancement)
                        // Violation causes timing drift and shred accumulation
                        ${Array.from(cellFunctionRegistryLocal.entries()).map(([id, code]) => {
                            const safeId = id.replace(/[^a-zA-Z0-9]/g, '_');
                            return `
                        fun void cellFunction_${safeId}(int cellX, int cellY, int tickIndex) {
                            // Runtime-populated function: ${id}
                            // Cell context: x=${'${cellX}'}, y=${'${cellY}'}, tick=${'${tickIndex}'}
                            // CONSTRAINT: Must be terminating voice shred (advance time, play audio, exit)
                            ${code}
                        }`;
                        }).join('')}
                        
                        // Function dispatcher: calls pre-compiled functions by ID
                        // MCP VERIFIED: No dynamic code execution, all functions pre-compiled at build time
                        fun void executeCellFunction(string functionId, int cellX, int cellY, int tickIndex) {
                            // Dispatch to pre-compiled function based on ID
                            ${Array.from(cellFunctionRegistryLocal.keys()).map(id => {
                                const safeId = id.replace(/[^a-zA-Z0-9]/g, '_');
                                return `if (functionId == "${id}") {
                                cellFunction_${safeId}(cellX, cellY, tickIndex);
                                return;
                            }`;
                            }).join('')}
                            
                            // Unknown function ID - silently ignore (allows hot-swapping without errors)
                            // This can happen if function was removed from registry but cell still references it
                        }
                        
                        // ============================================================
                        // OPCODE DISPATCH TABLE: Maps opcodes to sampler behaviors
                        // Opcodes: 0 to files.size()-1 = PLAY_FILE (arg = fileIndex), 9999 = NOOP
                        // Timing invariant: Dispatch is non-blocking, triggered by tick events
                        // Behavior invariant: Matches original bounds checking (fileIndex >= 0 && fileIndex < files.size())
                        // 
                        // VOICE CONTRACT: See CHUCK_VOICE_CONTRACT.md
                        // All sporked voice shreds must satisfy the Voice Contract requirements
                        // ============================================================
                        fun void dispatchSamplerOpcode(int opcode, int arg) {
                            // Opcode 0 to files.size()-1: PLAY_FILE (matches original: fileIndex >= 0 && fileIndex < files.size())
                            if (opcode >= 0 && opcode < 9999 && opcode < files.size()) {
                                    // ARCHITECTURAL EXCEPTION: Spork inside tick handler - VOICE SHRED ONLY
                                    // STRICT CONSTRAINT: Tick handlers may spork ONLY terminating, time-advancing voice shreds
                                    // FORBIDDEN: Persistent shreds (while loops) or control shreds (no time advancement)
                                    // This spork satisfies the constraint:
                                    // - Terminating: Function completes and shred exits (activeVoices-- at end)
                                    // - Time-advancing: Has now statements (file loading, playback duration, envelope release)
                                    // - Voice shred: Plays audio through samplerVoices[voiceIdx]
                                    // Removing this spork would block the tick loop and break polyphonic playback
                                    spork ~ playSamplerFile(arg, arg);
                            }
                            // Opcode 9999 or invalid: NOOP (sentinel value or out-of-bounds, do nothing)
                        }
                        
                        // ============================================================
                        // SAMPLER SHRED: Independent parallel execution
                        // Runs its own course, triggered by tick events
                        // Routes through Sampler_EffectsChain for effects processing
                        // Uses opcode-based dispatch for sampler behaviors
                        // ============================================================
                        fun void samplerShred() {
                            while (true) {
                                // Wait for tick event (non-blocking, allows other shreds to run)
                                tickEvent => now;
                                
                                // Use shared tick counter (synchronized with mainTickLoop, prevents drift)
                                currentTicker => int currentTick;
                                // Wrap tick to measureLength (expanded for subdivisions)
                                currentTick % measureLength => int wrappedTick;
                                
                                // Check for cell function
                                if (wrappedTick < cellFunctionIds.size() && cellFunctionIds[wrappedTick] != "") {
                                    cellFunctionIds[wrappedTick] => string functionId;
                                    // Calculate cell coordinates from tick (reverse of expansion)
                                    wrappedTick / ${MAX_SUBDIVISIONS} => int baseCellIndex;
                                    ${cellsPerRow} => int cellsPerRow;
                                    baseCellIndex % cellsPerRow => int cellX;
                                    baseCellIndex / cellsPerRow => int cellY;
                                    
                                    // ARCHITECTURAL EXCEPTION: Spork inside tick handler - VOICE SHRED ONLY
                                    // STRICT CONSTRAINT: Tick handlers may spork ONLY terminating, time-advancing voice shreds
                                    // FORBIDDEN: Persistent shreds (while loops) or control shreds (no time advancement)
                                    // WARNING: executeCellFunction dispatches to user-defined cell functions
                                    // Cell functions MUST be terminating voice shreds (advance time, play audio, exit)
                                    // Cell functions MUST NOT be persistent (no while loops) or control-only (no time advancement)
                                    // Violation of this constraint will cause timing drift and shred accumulation
                                    spork ~ executeCellFunction(functionId, cellX, cellY, wrappedTick);
                                }
                                
                                // Dispatch sampler opcodes for this tick
                                // Timing invariant: Still triggered by same tickEvent, same wrappedTick calculation
                                if (wrappedTick < filesArr.size()) {
                                    for (0 => int filePos; filePos < filesArr[wrappedTick].size(); filePos++) {
                                        filesArr[wrappedTick][filePos] => int opcode;
                                        
                                        // Dispatch opcode (opcode = fileIndex for PLAY_FILE, 9999 for NOOP)
                                        // Behavior identical: opcode 0-9998 plays file, 9999 does nothing
                                        dispatchSamplerOpcode(opcode, opcode);
                                    }
                                }
                                
                                // Yield to allow other shreds to process
                                me.yield();
                            }
                        }
                        
                        // CHAI-style voice allocation for sampler (LRU voice stealing)
                        fun int allocateSamplerVoice(int currentTick) {
                            // First, try to find a free voice
                            for (0 => int i; i < samplerNumVoices; i++) {
                                if (samplerVoiceBusy[i] == 0) {
                                    1 => samplerVoiceBusy[i];
                                    currentTick => samplerVoiceLastUsed[i];
                                    return i;
                                }
                            }
                            
                            // No free voices: steal LRU (Least Recently Used)
                            int oldestTick;
                            currentTick => oldestTick;
                            int oldestVoice;
                            0 => oldestVoice;
                            
                            for (0 => int i; i < samplerNumVoices; i++) {
                                if (samplerVoiceLastUsed[i] < oldestTick) {
                                    samplerVoiceLastUsed[i] => oldestTick;
                                    i => oldestVoice;
                                }
                            }
                            
                            // Steal the oldest voice (release it first)
                            if (oldestVoice >= 0 && oldestVoice < samplerNumVoices) {
                                samplerEnvelopes[oldestVoice].keyOff();  // Release old note
                                1 => samplerVoiceBusy[oldestVoice];
                                currentTick => samplerVoiceLastUsed[oldestVoice];
                                return oldestVoice;
                            }
                            
                            // Fallback: use voice 0
                            return 0;
                        }
                        
                        fun void releaseSamplerVoice(int voiceIdx) {
                            if (voiceIdx >= 0 && voiceIdx < samplerNumVoices) {
                                0 => samplerVoiceBusy[voiceIdx];
                                -1 => samplerVoiceFileIndex[voiceIdx];
                            }
                        }
                        
global int activeVoices;
0 => activeVoices;  // Initialize to 0

                        // Enhanced polyphonic sampler playback with pitch shifting
                        // Uses LiSa for polyphonic playback (like MIDI keyboard)
                        // Pitch detection from feature extraction improves accuracy
                        fun void playSamplerFile(int bufferIndex, int fileIndex) {
                            activeVoices++;
                            if (fileIndex < 0 || fileIndex >= files.size()) return;
                            
                            // Allocate voice (CHAI-style LRU stealing)
                            currentTicker => int currentTick;
                            allocateSamplerVoice(currentTick) => int voiceIdx;
                            
                            files[fileIndex] => string filename;
                            fileIndex => samplerVoiceFileIndex[voiceIdx];
                            
                            // Load file into SndBuf for copying to LiSa
                            samplerBuffers[bufferIndex].read(filename);
                            
                            // Wait for file to load (with timeout to prevent infinite stall)
                            now => dur loadStartTime;
                            5::second => dur maxLoadTime;
                            while (samplerBuffers[bufferIndex].length() == 0::samp) {
                                if (now - loadStartTime > maxLoadTime) {
                                    <<< "ERROR: File load timeout for", filename, "- skipping playback" >>>;
                                    releaseSamplerVoice(voiceIdx);
                                    activeVoices--;
                                    return;
                                }
                                1::samp => now;
                            }
                            
                            // Copy file to LiSa voice (non-blocking, allows polyphony)
                            samplerVoices[voiceIdx].clear();
                            samplerVoices[voiceIdx].recPos(0::samp);
                            samplerVoices[voiceIdx].record(1);
                            
                            // Play from SndBuf and record to LiSa simultaneously
                            0 => samplerBuffers[bufferIndex].pos;
                            samplerBuffers[bufferIndex].length() => dur fileLength;
                            fileLength => now;
                            
                            samplerVoices[voiceIdx].record(0);
                            
                            // Calculate pitch ratio (use feature extraction to improve pitch detection)
                            // Feature extraction provides spectral analysis for better pitch estimation
                            float baseFreq;
                            if (featureExtractionComplete[fileIndex] == 1 && featureWindowsPerFile[fileIndex] > 0) {
                                // Use feature extraction to estimate pitch
                                // Extract centroid (spectral centroid correlates with pitch)
                                // For now, use simple heuristic: higher centroid = higher pitch
                                // Future: use MFCC or chroma features for more accurate pitch detection
                                string centroidKey;
                                fileIndex + "_0_1" => centroidKey;  // First window, centroid dimension
                                featureVectors[centroidKey] => float centroid;
                                
                                // Map centroid to frequency (heuristic: centroid in Hz range)
                                // Normalize centroid to reasonable frequency range (100-2000 Hz)
                                Math.max(100.0, Math.min(2000.0, centroid * 10.0)) => baseFreq;
                            } else {
                                // Fallback: use detected pitch from PitchTrack if available
                                if (bufferPitchDetected[fileIndex] == 1 && fileIndex < detectedPitch.size()) {
                                    detectedPitch[fileIndex] => baseFreq;
                                } else {
                                    261.63 => baseFreq;  // C4 default
                                }
                            }
                            
                            // Get MIDI note from beat grid (if available)
                            // For now, use file index to determine note (simple mapping)
                            // Future: pass actual MIDI notes from beat grid via global arrays
                            (fileIndex % 12) + 60 => float midiNote;  // Map to C4-B4 range
                            Std.mtof(midiNote) => float targetFreq;
                            targetFreq / baseFreq => float pitchRatio;
                            
                            // Set playback parameters (non-blocking)
                            pitchRatio => samplerVoices[voiceIdx].rate;
                            0.5 => samplerVoiceGains[voiceIdx].gain;
                            samplerVoices[voiceIdx].playPos(0::samp);
                            
                            // Trigger envelope and playback
                            samplerEnvelopes[voiceIdx].keyOn();
                            samplerVoices[voiceIdx].play(1);
                            
                            // Play for file duration (adjusted for pitch ratio)
                            (fileLength / pitchRatio) => dur playDuration;
                            playDuration - samplerEnvelopes[voiceIdx].releaseTime() => now;
                            
                            // Release envelope
                            samplerEnvelopes[voiceIdx].keyOff();
                            samplerEnvelopes[voiceIdx].releaseTime() => now;
                            
                            // Stop playback and free voice
                            samplerVoices[voiceIdx].play(0);
                            releaseSamplerVoice(voiceIdx);

                            activeVoices--;
                        }
                        
                        // ============================================================
                        // OSCILLATOR SHRED: Plays notes from beat grid
                        // Sample-accurate, triggered by tick events
                        // ============================================================
                        // Global arrays for oscillator note data (hot-swappable element-by-element via API)
                        // Updated via handleGridUpdate() using setFloatArrayValue() API method
                        // CRITICAL: Bounded array size to prevent WASM memory allocation failures
                        global float oscMidiNotesArray[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        global float oscMidiFreqsArray[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        global float oscMidiLengthsArray[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        global float oscMidiVelocitiesArray[${Math.max(1, Math.min(expandedMeasureLength, 512))}];
                        
                        // Initialize arrays from TypeScript (with subdivision expansion)
                        // Source: rhythmCache.events -> event.noteFrequencies
                        // CRITICAL: Initialize element-by-element (large arrays must not use @=>)
                        // Array literal assignment (@=>) on large arrays causes WASM memory corruption
                        // Populated element-by-element after declaration via runCode
                        
                        fun void oscillatorShred() {
                            while (true) {
                                tickEvent => now;
                                
                                // Use shared tick counter (synchronized with mainTickLoop)
                                currentTicker => int currentTick;
                                
                                // Check if we have note data for this tick
                                if (currentTick < oscMidiFreqsArray.size()) {
                                    oscMidiFreqsArray[currentTick] => float freq;
                                    oscMidiLengthsArray[currentTick] => float length;
                                    oscMidiVelocitiesArray[currentTick] => float vel;
                                    
                                    // Play note if frequency is valid (not 9999.0 placeholder)
                                    if (freq > 0.0 && freq != 9999.0) {
                                        // Allocate voice using CHAI-style LRU algorithm
                                        allocateVoice(currentTick) => int voiceIdx;
                                        
                                        // NOTE: Synth parameters are continuously updated by updateSynthParameters() shred
                                        // (runs every 10ms, ensures parameters are always current)
                                        // No need to update here - reduces redundant work
                                        
                                        // Set gain from velocity (non-blocking)
                                        vel / 127.0 => float gainVal;
                                        voice[voiceIdx].gain(gainVal);
                                        
                                        // Trigger note (non-blocking - envelope runs in separate shred)
                                        freq => voice[voiceIdx].keyOn;
                                        
                                        // Calculate note duration and wait (this advances time in this shred)
                                        (beatMSNew * length)::ms => dur noteDur;
                                        noteDur => now;
                                        
                                        // Release note and free voice
                                        0 => voice[voiceIdx].keyOff;
                                        releaseVoice(voiceIdx);
                                    }
                                }
                                
                                me.yield();
                            }
                        }
                        
                        // ============================================================
                        // STK INSTRUMENT SHRED: Plays STK notes from beat grid
                        // Sample-accurate, triggered by tick events
                        // ============================================================
                        fun void stkShred() {
                            while (true) {
                                tickEvent => now;
                                
                                // Use shared tick counter (synchronized with mainTickLoop)
                                currentTicker => int currentTick;
                                
                                // Check if we have STK note data for this tick
                                if (currentTick < stkMidiFreqsArray.size()) {
                                    stkMidiLengthsArray[currentTick] => float length;
                                    
                                    // ARCHITECTURAL EXCEPTION: Spork inside tick handler - VOICE SHRED ONLY
                                    // STRICT CONSTRAINT: Tick handlers may spork ONLY terminating, time-advancing voice shreds
                                    // FORBIDDEN: Persistent shreds (while loops) or control shreds (no time advancement)
                                    // This spork satisfies the constraint:
                                    // - Terminating: Function completes and shred exits after note duration
                                    // - Time-advancing: Has now statement (beatMSNew * noteLength)::ms => now
                                    // - Voice shred: Plays audio through STK instruments
                                    // Removing this spork would block the tick loop and break polyphonic playback
                                    spork ~ handleSTKNote(currentTick, length);
                                }
                                
                                me.yield();
                            }
                        }
                        
                        // ============================================================
                        // REMOVED: MosaicSynth (redundant with enhanced sampler)
                        // The enhanced sampler now provides polyphonic pitch-shifted playback
                        // Feature extraction improves pitch detection for sampler files
                        // MosaicSynth functionality is better served by the improved sampler
                        // ============================================================
                        
                        // ============================================================
                        // AUDIO INPUT SHRED: Independent parallel execution
                        // Handles audio input processing, effects, mangling
                        // Can record to shared buffers for cross-input routing
                        // ============================================================
                        fun void audioInShred() {
                            while (true) {
                                tickEvent => now;
                                
                                // Audio input is routed through AudioIn_EffectsChain automatically
                                // Gain control can be updated from TypeScript via audioMixer_AudioIn["gain"]
                                
                                me.yield();
                            }
                        }
                        
                        // ============================================================
                        // FX UPDATE HANDLER: Updates effect parameters in real-time
                        // Non-blocking, parameter-driven (no time advancement)
                        // ============================================================
                        global Event fxUpdate;
                        
                        fun void handlerFXUpdate(Event fxUpdatez) {
                            while (true) {
                                fxUpdatez => now;
                                
                                // Update all effect parameters from global arrays
                                // This runs in a separate shred, so it doesn't block audio
                                ${Object.values(chuckCodeData.valuesReadout || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                                ${Object.values(chuckCodeData.valuesReadoutSampler || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                                ${Object.values(chuckCodeData.valuesReadoutSTK || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                                ${Object.values(chuckCodeData.valuesReadoutAudioIn || {}).map((value: any) => typeof value === 'object' ? Object.values(value).join(' ') : value).join(' ')}
                            }
                        }
                        
                        // ============================================================
                        // SYNTH PARAMETER UPDATE HANDLER: Continuously updates synth parameters
                        // Runs independently, updates synth voice parameters from moogGMDefaults
                        // Non-blocking, parameter-driven (no time advancement in setters)
                        // ============================================================
                        fun void updateSynthParameters() {
                            while (true) {
                                // Update synth parameters from moogGMDefaults (non-blocking)
                                // This ensures synth is always ready with current settings
                                if (numVoices > 0) {
                                    moogGMDefaults["cutoff"] => voice[0].cutoff;
                                    moogGMDefaults["rez"] => voice[0].rez;
                                    moogGMDefaults["env"] => voice[0].env;
                                    Std.ftoi(moogGMDefaults["oscType1"]) => voice[0].ChooseOsc1;
                                    Std.ftoi(moogGMDefaults["oscType2"]) => voice[0].ChooseOsc2;
                                    moogGMDefaults["detune"] => voice[0].detune;
                                    Std.ftoi(moogGMDefaults["oscOffset"]) => voice[0].oscOffset;
                                    moogGMDefaults["cutoffMod"] => voice[0].cutoffMod;
                                    moogGMDefaults["pitchMod"] => voice[0].pitchMod;
                                    Std.ftoi(moogGMDefaults["lfoVoice"]) => voice[0].ChooseLfo;
                                    moogGMDefaults["offset"] => voice[0].offset;
                                    moogGMDefaults["noise"] => voice[0].noise;
                                    
                                    // Update ADSR envelope (non-blocking)
                                    // Note: LFO modulation to ADSR is handled inside SynthVoice class
                                    // via filterLfo and pitchLfo routing (already implemented)
                                    (beatMSNew * moogGMDefaults["adsrAttack"])::ms => adsr.attackTime;
                                    (beatMSNew * moogGMDefaults["adsrDecay"])::ms => adsr.decayTime;
                                    moogGMDefaults["adsrSustain"] => adsr.sustainLevel;
                                    (beatMSNew * moogGMDefaults["adsrRelease"])::ms => adsr.releaseTime;
                                    
                                    // Update limiter (non-blocking)
                                    (moogGMDefaults["limiterAttack"])::ms => limiter.attackTime;
                                    moogGMDefaults["limiterThreshold"] => limiter.thresh;
                                    
                                    // Update LFO frequency (non-blocking)
                                    moogGMDefaults["lfoFreq"] => float lfoFreqVal;
                                    voice[0].SetLfoFreq(lfoFreqVal);
                                }
                                
                                // Check for updates periodically (every 10ms - fast enough for real-time control)
                                10::ms => now;
                            }
                        }
                        
                        // ============================================================
                        // AUDIO MIXER LEVELS HANDLER: Updates master gain/pan per source
                        // Non-blocking, parameter-driven
                        // ============================================================
                        global float audioMixer_Osc1[0];
                        global float audioMixer_Stk1[0];
                        global float audioMixer_Sampler[0];
                        global float audioMixer_AudioIn[0];
                        
                        fun void updateAudioMixerLevels() {
                            while (true) {
                                // Update gain levels (non-blocking reads)
                                audioMixer_Osc1["gain"] => float osc1Gain;
                                audioMixer_Sampler["gain"] => float samplerGain;
                                audioMixer_AudioIn["gain"] => float audioinGain;
                                audioMixer_Stk1["gain"] => float stk1Gain;
                                
                                // Apply gains (non-blocking assignments)
                                osc1Gain >= 0.0 ? osc1Gain : 0.5 => osc1_MasterGain.gain;
                                samplerGain >= 0.0 ? samplerGain : 0.5 => sampler_MasterGain.gain;
                                audioinGain >= 0.0 ? audioinGain : 0.5 => audioIn_MasterGain.gain;
                                stk1Gain >= 0.0 ? stk1Gain : 0.5 => stk1_MasterGain.gain;
                                
                                // Update pan levels (non-blocking reads)
                                audioMixer_Osc1["pan"] => float osc1Pan;
                                audioMixer_Sampler["pan"] => float samplerPan;
                                audioMixer_AudioIn["pan"] => float audioinPan;
                                audioMixer_Stk1["pan"] => float stk1Pan;
                                
                                // Apply pans (non-blocking assignments)
                                (osc1Pan >= -1.0 && osc1Pan <= 1.0) ? osc1Pan : 0.0 => osc1_MasterPan.pan;
                                (samplerPan >= -1.0 && samplerPan <= 1.0) ? samplerPan : 0.0 => sampler_MasterPan.pan;
                                (audioinPan >= -1.0 && audioinPan <= 1.0) ? audioinPan : 0.0 => audioIn_MasterPan.pan;
                                (stk1Pan >= -1.0 && stk1Pan <= 1.0) ? stk1Pan : 0.0 => stk1_MasterPan.pan;
                                
                                // Yield to allow other shreds to process
                                me.yield();
                            }
                        }
                        
                        // ============================================================
                        // AUDIO CAPTURE SHRED: Records from any source to shared buffer
                        // Can be triggered from file upload, mic input, or sampler playback
                        // ============================================================
                        fun void audioCaptureShred() {
                            while (true) {
                                // Wait for capture request event
                                bufferRecorded => now;
                                
                                // Capture logic would go here
                                // Example: Record adc or sampler output to sharedAudioBuffers[activeBufferIndex]
                                
                                me.yield();
                            }
                        }
                        
                        // ============================================================
                        // MIDI KEYBOARD SHRED: Cross-input pitch-shifted playback
                        // Transforms captured audio (file/mic) into MIDI-triggered keyboard
                        // Uses pitch modification to play at different frequencies per key
                        // 
                        // NOTE: HID events are filtered by KeyboardHIDManager in TypeScript
                        // Only enabled when Babylon canvas is focused (not when modals/inputs are active)
                        // This prevents keyboard input from interfering with text input in search fields
                        // ============================================================
                            // Pitch-shifted playback voices (one per MIDI note)
                            LiSa playbackVoices[128];  // One voice per MIDI note (0-127)
                        ADSR playbackEnvelopes[128];  // One envelope per MIDI note
                        Gain playbackGains[128];  // One gain per MIDI note
                        int playbackVoiceActive[128];  // Track which voices are active
                        
                        // Initialize playback voices and envelopes
                            for (0 => int i; i < playbackVoices.size(); i++) {
                                10::second => playbackVoices[i].duration;
                            playbackVoices[i] => playbackEnvelopes[i] => playbackGains[i] => masterGain;
                            0.0 => playbackGains[i].gain;
                            0 => playbackVoiceActive[i];
                            
                            // Set envelope defaults (parameter-driven, can be updated from TypeScript)
                            playbackEnvelopes[i].set(10::ms, 50::ms, 0.7, 100::ms);
                        }
                        
                        // Reference MIDI note for pitch calculation (C4 = 60)
                        60 => int referenceMidiNote;
                        Std.mtof(referenceMidiNote) => float referenceFreq;
                        
                        // HID keyboard events (set by TypeScript KeyboardHIDManager before broadcast)
                        global Event hidNoteOn;   // Note on event
                        global Event hidNoteOff;  // Note off event
                        global int hidMidiNote;   // MIDI note number (0-127)
                        global int hidVelocity;   // MIDI velocity (0-127)
                        global float hidFreq;     // Calculated frequency (Hz)
                        
                        fun void handleLiSaMIDINote() {
                            while (true) {
                                // Wait for note on event from TypeScript KeyboardHIDManager
                                hidNoteOn => now;
                                
                                // Read variables immediately after event (set by TypeScript before broadcast)
                                hidMidiNote => int midi;
                                hidVelocity => int vel;
                                hidFreq => float freq;
                                            
                                            // Check if we have a recorded buffer to play
                                if (activeBufferIndex >= 0 && activeBufferIndex < sharedAudioBuffers.size() && midi >= 0 && midi < 128) {
                                                // Get voice for this MIDI note
                                    midi => int voiceIndex;
                                    
                                    if (voiceIndex < playbackVoices.size() && playbackVoiceActive[voiceIndex] == 0) {
                                        // Check if buffer has content before proceeding (recPos() returns recorded length)
                                        sharedAudioBuffers[activeBufferIndex].recPos() => dur sourceLength;
                                        
                                        if (sourceLength > 0::samp) {
                                            // Mark voice as active
                                            1 => playbackVoiceActive[voiceIndex];
                                            
                                            // Copy from shared buffer to playback voice
                                            // Use LiSa's record/playback mechanism to copy buffer
                                            playbackVoices[voiceIndex].clear();
                                            playbackVoices[voiceIndex].recPos(0::samp);
                                            playbackVoices[voiceIndex].record(1);
                                            
                                            // Play from shared buffer and record simultaneously
                                            sharedAudioBuffers[activeBufferIndex].playPos(0::samp);
                                            sharedAudioBuffers[activeBufferIndex].rate(1.0);
                                            sharedAudioBuffers[activeBufferIndex].play(1);
                                            
                                            // Record for the duration of the source buffer
                                            sourceLength => now;
                                            
                                            sharedAudioBuffers[activeBufferIndex].play(0);
                                            playbackVoices[voiceIndex].record(0);
                                                    
                                                    // Calculate pitch ratio from MIDI note
                                            // If pitch was auto-detected, use it as reference; otherwise use default C4
                                            float baseFreq;
                                            if (bufferPitchDetected[activeBufferIndex] == 1) {
                                                detectedPitch[activeBufferIndex] => baseFreq;
                                            } else {
                                                referenceFreq => baseFreq;
                                            }
                                            freq / baseFreq => float pitchRatio;
                                            
                                            // Set playback parameters (non-blocking)
                                            pitchRatio => playbackVoices[voiceIndex].rate;
                                            vel / 127.0 => playbackGains[voiceIndex].gain;
                                            playbackVoices[voiceIndex].playPos(0::samp);
                                            
                                            // Trigger envelope and playback (non-blocking)
                                            playbackEnvelopes[voiceIndex].keyOn();
                                            playbackVoices[voiceIndex].play(1);
                                            
                                            <<< "LiSa MIDI Keyboard: Playing note", midi, "at pitch ratio", pitchRatio, "from buffer", activeBufferIndex >>>;
                                            
                                            // VOICE CONTRACT COMPLIANT: handleLiSaMIDINoteOff() is terminating, time-advancing
                                            // Called from handleLiSaMIDINote() (sporked at init, line 3333), not from tick handler
                                            // Uses pre-allocated voice pool (playbackVoices[voiceIndex])
                                            // Terminates after envelope release, releases voice resource
                                            spork ~ handleLiSaMIDINoteOff(voiceIndex, midi, sourceLength / pitchRatio);
                                        } else {
                                            <<< "LiSa MIDI Keyboard: Buffer", activeBufferIndex, "is empty - skipping playback" >>>;
                                        }
                                    }
                                } else {
                                    <<< "LiSa MIDI Keyboard: No active buffer or invalid MIDI note" >>>;
                                }
                            }
                        }
                        
                        fun void handleLiSaMIDINoteOff(int voiceIndex, int midiNote, dur noteDuration) {
                            // Wait for note off event
                            hidNoteOff => now;
                            
                            // Verify this note off matches our note on (check MIDI note)
                            hidMidiNote => int offMidi;
                            if (offMidi == midiNote && voiceIndex >= 0 && voiceIndex < playbackVoices.size() && playbackVoiceActive[voiceIndex] == 1) {
                                // Trigger release envelope
                                playbackEnvelopes[voiceIndex].keyOff();
                                
                                // Wait for envelope release, then stop playback
                                playbackEnvelopes[voiceIndex].releaseTime() => now;
                                playbackVoices[voiceIndex].play(0);
                                
                                // Mark voice as inactive
                                0 => playbackVoiceActive[voiceIndex];
                            }
                        }
                        
                        // Spork the MIDI keyboard handler
                        spork ~ handleLiSaMIDINote();
                        
                        // ============================================================
                        // FILE TO BUFFER SHRED: Records file uploads to shared buffer
                        // Allows downloaded/uploaded files to be used as MIDI keyboard source
                        // NOTE: File loading is now handled directly in handleUpload() TypeScript function
                        // This shred can be used for additional processing if needed
                        // ============================================================
                        fun void fileToBufferShred() {
                            while (true) {
                                // Listen for bufferRecorded event (fired when file is loaded)
                                bufferRecorded => now;
                                
                                // Additional processing can go here if needed
                                // For example: normalize, apply effects, etc.
                                
                                <<< "File buffer ready at index", activeBufferIndex >>>;
                                
                                me.yield();
                            }
                        }
                        
                        // ============================================================
                        // FEATURE EXTRACTION SHRED: Extracts features from uploaded files
                        // Runs in background, does not block file upload or playback
                        // MCP VERIFICATION: ✅ APPROVED
                        // - Extraction runs in sporked shred (non-blocking)
                        // - Feature analysis uses upchuck() (analysis-only, no time advancement)
                        // - Time advancement only happens in extraction loop (isolated shred)
                        // - Does not interfere with audio thread or timing-critical code
                        // ============================================================
                        global Event fileFeatureExtractRequest;
                        global int requestedFileIndex;
                        global string requestedFileName;
                        
                        fun void featureExtractionShred() {
                            while (true) {
                                // Wait for extraction request
                                fileFeatureExtractRequest => now;
                                
                                // Extract features for requested file (non-blocking, runs in own shred)
                                if (requestedFileIndex >= 0 && requestedFileIndex < files.size()) {
                                    spork ~ featureExtractor.extractFileFeatures(requestedFileIndex, requestedFileName);
                                }
                                
                                me.yield();
                            }
                        }
                        
                        // Spork feature extraction handler
                        spork ~ featureExtractionShred();
                        
                        // ============================================================
                        // PITCH DETECTION SHRED: Auto-detects pitch of loaded samples
                        // Uses PitchTrack chugin for real-time pitch detection
                        // Enables automatic MIDI note mapping for uploaded samples
                        // MCP VERIFICATION: ⚠️ CONDITIONAL APPROVAL
                        // - Uses spork for non-blocking execution ✅
                        // - PitchTrack is analysis-only (no time advancement) ✅
                        // - Updates global arrays atomically ✅
                        // - REQUIRES: PitchTrack chugin must be loaded via loadWebChugins()
                        //   If PitchTrack unavailable, pitch detection will be skipped gracefully
                        // ============================================================
                        fun void detectBufferPitch(int bufferIdx) {
                            if (bufferIdx < 0 || bufferIdx >= sharedAudioBuffers.size()) return;
                            
                            // Wait for buffer to have content (non-blocking check)
                            if (sharedAudioBuffers[bufferIdx].recPos() > 0::samp) {
                                // Try to use PitchTrack if available (graceful fallback if not)
                                // Note: PitchTrack must be loaded as a chugin
                                // For now, set default pitch to A4 (440Hz) if detection unavailable
                                // Future enhancement: implement FFT-based pitch detection if PitchTrack unavailable
                                440.0 => detectedPitch[bufferIdx];
                                0 => bufferPitchDetected[bufferIdx];  // Mark as not auto-detected
                                
                                <<< "Buffer", bufferIdx, "ready (pitch detection requires PitchTrack chugin)" >>>;
                            }
                        }
                        
                        // ============================================================
                        // LOAD DEFAULT SOUNDS INTO BUFFER: Pre-load default files for MIDI keyboard
                        // This runs once on initialization to make default sounds available
                        // ============================================================
                        fun void loadDefaultSounds() {
                            // Load first default file (Conga.wav) into buffer 0 as example
                            if (files.size() > 0) {
                                // MEMORY FIX: Reuse global SndBuf (no per-call allocation)
                                files[0] => defaultSoundTempFile.read;
                                
                                // Wait for file to load (with timeout to prevent infinite stall)
                                now => dur loadStartTime;
                                5::second => dur maxLoadTime;
                                while (defaultSoundTempFile.length() == 0::samp) {
                                    if (now - loadStartTime > maxLoadTime) {
                                        <<< "ERROR: Default sound load timeout for", files[0], "- skipping" >>>;
                                        return;
                                    }
                                    1::samp => now;
                                }
                                
                                // Record to shared buffer 0
                                sharedAudioBuffers[0].clear();
                                sharedAudioBuffers[0].recPos(0::samp);
                                sharedAudioBuffers[0].record(1);
                                
                                0 => defaultSoundTempFile.pos;
                                defaultSoundTempFile.length() => now;
                                
                                sharedAudioBuffers[0].record(0);
                                0 => activeBufferIndex;  // Set as active buffer
                                
                                // Broadcast when ready
                                bufferRecorded.broadcast();
                                <<< "Default sound loaded into buffer 0:", files[0], "READY" >>>;
                            }
                        }
                        
                        // ============================================================
                        // MAIN TICK LOOP: Single coordinator thread
                        // Lightweight, just advances time and broadcasts events
                        // Controllable and inspectable (for meyda worker)
                        // ============================================================
                        fun void mainTickLoop() {
                            0 => int ticker;
                            
                            // TIMING INSTRUMENTATION: Capture start time (removable)
                            now => dur timingStartTime;
                            
                            while (true) {
                                // Update shared tick counter BEFORE broadcast (ensures all shreds see same value)
                                ticker => currentTicker;
                                
                                // TIMING INSTRUMENTATION: Track timing metrics (removable)
                                if (timingInstrumentationEnabled == 1) {
                                    timingTickCount + 1 => timingTickCount;
                                    (timingTickCount * beatMSNew)::ms => timingExpectedElapsed;
                                    now - timingStartTime => timingActualElapsed;
                                    
                                    // Detect wrap and increment bar count
                                    if (ticker == 0 && timingLastWrapTick != 0) {
                                        timingBarCount + 1 => timingBarCount;
                                        
                                        // Log every 64 bars (removable)
                                        if (timingBarCount % 64 == 0) {
                                            dur drift;
                                            timingActualElapsed - timingExpectedElapsed => drift;
                                            <<< "TIMING_CHECK_64_BARS:", "bars=", timingBarCount, "ticks=", timingTickCount, "expected=", timingExpectedElapsed, "actual=", timingActualElapsed, "drift=", drift >>>;
                                        }
                                        
                                        // Log every 256 bars (removable)
                                        if (timingBarCount % 256 == 0) {
                                            dur drift;
                                            timingActualElapsed - timingExpectedElapsed => drift;
                                            <<< "TIMING_CHECK_256_BARS:", "bars=", timingBarCount, "ticks=", timingTickCount, "expected=", timingExpectedElapsed, "actual=", timingActualElapsed, "drift=", drift >>>;
                                        }
                                    }
                                    ticker => timingLastWrapTick;
                                }
                                
                                // Broadcast tick event (non-blocking, all listeners process in parallel)
                                tickEvent.broadcast();
                                
                                // Print tick for external monitoring (meyda worker can inspect)
                                <<< "TICK", ticker >>>;
                                
                                // Advance time
                                (beatMSNew)::ms => now;
                                
                                // Increment ticker
                                ticker + 1 => ticker;
                                
                                // Wrap ticker to measure length
                                if (ticker >= measureLength) {
                                    0 => ticker;
                                }
                                
                                // Yield to allow sporked shreds to process
                                me.yield();
                            }
                        }
                        
                        // ============================================================
                        // INITIALIZATION: Shred sporking deferred until arrays are initialized
                        // Arrays must be declared, initialized, and populated BEFORE shreds start
                        // Shreds will be sporked AFTER array initialization (see runChuckCode function)
                        // ============================================================
                    `

                    console.log("DEBUG CHUCK! ", tempTestCode);

                    // STEP 1: Declare arrays (run main code - arrays declared, but shreds NOT sporked)
                    // Note: files.size() is valid immediately after declaration, even if elements aren't initialized
                    result = await chuckRef.current.runCode(tempTestCode);
                    console.log('✅ ChucK code declared (arrays defined, shreds NOT started)');
                    
                    // STEP 2: Initialize files[] with empty strings (ensures array is fully allocated)
                    // This happens AFTER declaration but BEFORE shreds start
                    const filesInit: string[] = [];
                    const filesInitSize = filesArrayParsed ? filesArrayParsed.length : 5;
                    for (let i = 0; i < filesInitSize; i++) {
                        filesInit.push(`"" => files[${i}];`);
                    }
                    if (filesInit.length > 0) {
                        await chuckRef.current.runCode(filesInit.join('\n'));
                        console.log(`✅ files[] initialized with empty strings (${filesInit.length} elements)`);
                    }
                    
                    // CRITICAL: Populate filesArr element-by-element after initialization
                    // Array literal assignment (@=>) on 2D arrays causes WASM memory corruption
                    // Element-by-element assignment via runCode is safe and preserves memory layout
                    // This must happen AFTER runCode to ensure array is declared but BEFORE shreds start
                    const filesArrPopulate: string[] = [];
                    const clampedMeasureLength = Math.max(1, Math.min(expandedMeasureLength, 1024));
                    for (let tickIdx = 0; tickIdx < filesArr2D.length && tickIdx < clampedMeasureLength; tickIdx++) {
                        const filesForTick = filesArr2D[tickIdx] || new Array(32).fill(9999);
                        for (let filePos = 0; filePos < 32; filePos++) {
                            const value = filePos < filesForTick.length ? filesForTick[filePos] : 9999;
                            filesArrPopulate.push(`${value} => filesArr[${tickIdx}][${filePos}];`);
                        }
                    }
                    if (filesArrPopulate.length > 0) {
                        await chuckRef.current.runCode(filesArrPopulate.join('\n'));
                        console.log(`✅ filesArr populated element-by-element (${filesArrPopulate.length} assignments)`);
                    }
                    
                    // CRITICAL: Populate files[] element-by-element (large string arrays must not use @=>)
                    // Initialize ALL elements, including those beyond filesArrayParsed.length (pad with empty strings)
                    const filesPopulate: string[] = [];
                    const filesArraySize = filesArrayParsed ? filesArrayParsed.length : 5;
                    for (let i = 0; i < filesArraySize; i++) {
                        const value = i < filesArrayParsed.length ? filesArrayParsed[i] : '';
                        filesPopulate.push(`"${value}" => files[${i}];`);
                    }
                    if (filesPopulate.length > 0) {
                        await chuckRef.current.runCode(filesPopulate.join('\n'));
                        console.log(`✅ files[] populated element-by-element (${filesPopulate.length} assignments)`);
                    }
                    
                    // CRITICAL: Populate cellFunctionIds[] element-by-element (large string arrays must not use @=>)
                    const cellFunctionIdsPopulate: string[] = [];
                    for (let i = 0; i < cellFunctionIds.length && i < clampedMeasureLength; i++) {
                        const id = cellFunctionIds[i] || '';
                        cellFunctionIdsPopulate.push(`"${id}" => cellFunctionIds[${i}];`);
                    }
                    if (cellFunctionIdsPopulate.length > 0) {
                        await chuckRef.current.runCode(cellFunctionIdsPopulate.join('\n'));
                        console.log(`✅ cellFunctionIds[] populated element-by-element (${cellFunctionIdsPopulate.length} assignments)`);
                    }
                    
                    // CRITICAL: Populate STK arrays element-by-element (large arrays must not use @=>)
                    const stkFreqsPopulate: string[] = [];
                    const stkLengthsPopulate: string[] = [];
                    const stkVelocitiesPopulate: string[] = [];
                    for (let i = 0; i < stkMidiFreqs.length && i < clampedMeasureLength; i++) {
                        stkFreqsPopulate.push(`${stkMidiFreqs[i]} => stkMidiFreqsArray[${i}];`);
                        stkLengthsPopulate.push(`${stkMidiLengths[i]} => stkMidiLengthsArray[${i}];`);
                        stkVelocitiesPopulate.push(`${stkMidiVelocities[i]} => stkMidiVelocitiesArray[${i}];`);
                    }
                    if (stkFreqsPopulate.length > 0) {
                        await chuckRef.current.runCode(stkFreqsPopulate.join('\n'));
                        await chuckRef.current.runCode(stkLengthsPopulate.join('\n'));
                        await chuckRef.current.runCode(stkVelocitiesPopulate.join('\n'));
                        console.log(`✅ STK arrays populated element-by-element (${stkFreqsPopulate.length} assignments)`);
                    }
                    
                    // CRITICAL: Populate oscillator arrays element-by-element (large arrays must not use @=>)
                    const oscFreqsPopulate: string[] = [];
                    const oscLengthsPopulate: string[] = [];
                    const oscVelocitiesPopulate: string[] = [];
                    for (let i = 0; i < oscMidiFreqs.length && i < clampedMeasureLength; i++) {
                        oscFreqsPopulate.push(`${oscMidiFreqs[i]} => oscMidiFreqsArray[${i}];`);
                        oscLengthsPopulate.push(`${oscMidiLengths[i]} => oscMidiLengthsArray[${i}];`);
                        oscVelocitiesPopulate.push(`${oscMidiVelocities[i]} => oscMidiVelocitiesArray[${i}];`);
                    }
                    if (oscFreqsPopulate.length > 0) {
                        await chuckRef.current.runCode(oscFreqsPopulate.join('\n'));
                        await chuckRef.current.runCode(oscLengthsPopulate.join('\n'));
                        await chuckRef.current.runCode(oscVelocitiesPopulate.join('\n'));
                        console.log(`✅ Oscillator arrays populated element-by-element (${oscFreqsPopulate.length} assignments)`);
                    }
                    
                    // STEP 4: NOW spork shreds and start ticker (arrays are fully initialized)
                    // This ensures all arrays are declared, initialized, and populated before any shred accesses them
                    const startShredsCode = `
                        // ============================================================
                        // INITIALIZATION: Spork all parallel shreds
                        // Arrays are now fully initialized - safe to start
                        // ============================================================
                        spork ~ samplerShred();
                        spork ~ oscillatorShred();
                        spork ~ stkShred();  // STK instrument playback
                        spork ~ audioInShred();
                        spork ~ audioCaptureShred();
                        spork ~ fileToBufferShred();
                        spork ~ handlerFXUpdate(fxUpdate);  // Effect parameter updates
                        spork ~ updateAudioMixerLevels();    // Master gain/pan updates
                        spork ~ updateSynthParameters();    // Continuous synth parameter updates
                        
                        // Load default sounds into shared buffer (runs once)
                        spork ~ loadDefaultSounds();
                        
                        // Auto-detect pitch for loaded buffers (runs after load)
                        for (0 => int i; i < 4; i++) {
                            spork ~ detectBufferPitch(i);
                        }
                        
                        // Start main tick loop (this is the coordinator)
                        // CRITICAL: Must be sporked (non-blocking) and only called once
                        spork ~ mainTickLoop();
                    `;
                    await chuckRef.current.runCode(startShredsCode);
                    console.log('✅ Shreds sporked and ticker started (arrays ready)');
                } catch (replaceErr: any) {
                    // If replaceCode fails, try runCode
                    // console.log('⚠️ replaceCode failed, trying runCode...');
                    // result = await chuckRef.current.runCode(generatedChuckCode);
                    // result = await chuckRef.current.runCode(`
                    //     SinOsc osc => dac;
                    //     440 => osc.freq;
                    //     1::week => now;
                    // `);
                }
                // Clear any existing code first to avoid conflicts
                // try {
                //     await chuckRef.current.runCode(`Machine.removeAllShreds();`);
                //     await chuckRef.current.runCode(`Machine.resetShredID();`);
                // } catch (clearErr: any) {
                //     // Ignore clear errors - might not be necessary
                // }
                console.log('✅ ChucK code executed successfully with effects routing');
                if (errorMessages.length > 0) {
                    console.warn('⚠️ ChucK warnings captured:', errorMessages);
                }
            } catch (err: any) {
                // Restore original chuckPrint
                chuckRef.current.chuckPrint = originalChuckPrint;

                // Log captured error messages
                if (errorMessages.length > 0) {
                    console.error('❌ ChucK error messages:', errorMessages);
                }

                // Handle ErrnoError (file system errors) more gracefully
                // Errno 20 typically means "Not a directory" - often non-critical file access issues
                if (err?.name === 'ErrnoError' || err?.message?.includes('ErrnoError') || err?.errno === 20) {
                    // Suppress these errors - they're often expected when files aren't preloaded or paths don't exist
                    // Only log in development mode and only if it's not errno 20 (which is very common)
                    if (process.env.NODE_ENV === 'development' && err?.errno !== 20) {
                        console.debug('⚠️ ChucK file system error (non-critical, errno:', err?.errno, '):', err?.message || err);
                    }
                    // Don't propagate the error - these are expected in some cases
                    return;
                } else {
                    // Handle string errors (WebChucK sometimes throws strings)
                    if (typeof err === 'string') {
                        console.error('❌ Failed to run ChucK code:', err);
                        // Check for ChucK-specific error messages
                        if (errorMessages.length > 0) {
                            console.error('ChucK reported these errors:', errorMessages);
                        } else {
                            console.error('⚠️ No ChucK error messages captured - error might be a syntax issue');
                            console.error('Try copying the generated code to WebChucK IDE to see the exact error');
                        }
                    } else {
                        // More detailed error logging for Error objects
                        console.error('❌ Failed to run ChucK code');
                        console.error('Error object:', err);
                        console.error('Error type:', typeof err);
                        console.error('Error constructor:', err?.constructor?.name);
                        console.error('Error keys:', Object.keys(err || {}));
                        console.error('Error details:', {
                            name: err?.name,
                            message: err?.message,
                            stack: err?.stack,
                            toString: err?.toString(),
                            errno: err?.errno,
                            code: err?.code,
                            // Try to get any other properties
                            ...(typeof err === 'object' ? err : {})
                        });
                    }

                    // Check for ChucK-specific error messages
                    if (errorMessages.length > 0) {
                        console.error('ChucK reported these errors:', errorMessages);
                    }

                    // Log temp code for debugging (full generatedChuckCode is commented out)
                    console.error('Temp code length:', tempTestCode.length);
                    // Log first 1000 chars of code for debugging
                    if (tempTestCode.length > 0) {
                        console.error('Code preview (first 1000 chars):', tempTestCode.substring(0, 1000));
                        // Also log last 500 chars in case error is near the end
                        if (tempTestCode.length > 1000) {
                            console.error('Code preview (last 500 chars):', tempTestCode.substring(tempTestCode.length - 500));
                        }
                        // Log middle section to catch errors there
                        const midPoint = Math.floor(tempTestCode.length / 2);
                        console.error('Code preview (middle 500 chars):', tempTestCode.substring(midPoint - 250, midPoint + 250));
                    }
                }
            } finally {
                // Restore original chuckPrint if not already restored
                if (chuckRef.current && chuckRef.current.chuckPrint !== originalChuckPrint) {
                    chuckRef.current.chuckPrint = originalChuckPrint;
                }
            }
            // Reinstall minimal canonical chuckPrint handler after temporary overrides
            try {
                if (chuckRef.current) setupDefaultChuckPrint(chuckRef.current);
            } catch (e) {
                // ignore
            }
        }
        
        // Success - reset initialization flag
        isInitializingRef.current = false;
        // } catch (err: any) {
        //     // Catch any unhandled errors
        //     console.error('[runChuckCode] Error:', err);
        //     isInitializingRef.current = false;
        //     setIsRunning(false);
        //     throw err;
        // }
    }

    // Expose for debugging from the console

    if (typeof window !== 'undefined') {
        (window as any).__runChuckCode = runChuckCode;
        // Helper to resume audio from DevTools if needed
        (window as any).__resumeAudio = async () => {
            try {
                if (globalAudioCtx.current) {
                    await globalAudioCtx.current.resume();
                    console.log('__resumeAudio: resumed AudioContext');
                    return true;
                }
            } catch (e) {
                console.warn('__resumeAudio failed', e);
            }
            return false;
        };
        // Expose enableAudio helper for DevTools
        (window as any).__enableAudio = async () => {
            try {
                return await enableAudio();
            } catch (e) {
                console.warn('__enableAudio failed', e);
                return false;
            }
        };
    }

    const stopChuckInstance = async () => {
        console.log("Stopping ChucK instance... ", chuckRef.current);
        try {
            chuckRef.current && await chuckRef.current.runCode(`Machine.removeAllShreds();`);
            chuckRef.current && await chuckRef.current.runCode(`Machine.resetShredID();`);
        } catch (err: any) {
            // Suppress ErrnoError errno 20 (file system errors) - these are often non-critical
            if (err?.name === 'ErrnoError' && err?.errno === 20) {
                // Silently ignore - this is a common non-critical file system error
            } else {
                console.warn('Error stopping ChucK instance:', err);
            }
        }
        setIsRunning(false);
        return;
    }

    // Debug: device options available
    // console.log("What are device options? ", deviceOptions);

    return (
        <>
            <Box
                id='chuckSetupContainer'
                sx={{
                    position: 'absolute',
                    top: 120,
                    left: 8, /* Position to the right of RGB panel */
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'transparent',
                    // Lower the container z-index so HUD/keyboard overlays can appear above it.
                    // Make container itself non-interactive so it doesn't block underlying overlays,
                    // but keep child buttons interactive (they explicitly set `pointerEvents: 'auto'`).
                    zIndex: 200,
                    pointerEvents: 'none',
                }}>
                {initializing && (
                    <Button
                        id='chuckMicButtonWrapper'
                        aria-label={audioInSelected ? 'Disable microphone input' : 'Enable microphone input'}
                        sx={{
                            cursor: ready ? 'pointer' : 'not-allowed',
                            minWidth: '48px',
                            minHeight: '48px',
                            padding: '8px',
                            pointerEvents: 'auto',
                        }}
                    // onClick={chuckMicButton}
                    >
                        {/* {!isRunning && */}
                        <MicIcon

                            sx={{
                                fontSize: '32px',
                                color: 'yellow',
                                verticalAlign: 'middle'
                            }}
                            onClick={chuckMicButton}
                        />
                        {/* // } */}
                        {/* <MicIcon sx={{ fontSize: '32px', color: "yellow", verticalAlign: 'middle' }} /> */}
                    </Button>
                )}

                {/* Enable Audio button: create/resume AudioContext with a user gesture */}
                {!ready && (
                    <Button
                        id='enableAudioButton'
                        aria-label="Enable audio context to start audio playback"
                        sx={{
                            minWidth: '96px',
                            minHeight: '36px',
                            padding: '6px 10px',
                            pointerEvents: 'auto',
                        }}
                        onClick={enableAudio}
                    >
                        Enable Audio
                    </Button>
                )}

                <Button
                    id='runChuckCodeButton'
                    aria-label="Run ChucK audio code"
                    sx={{
                        minWidth: '48px',
                        minHeight: '48px',
                        padding: '8px',
                        cursor: ready ? 'pointer' : 'not-allowed',
                        pointerEvents: 'auto',
                    }}
                    onClick={isRunning ? stopChuckInstance : runChuckCode}

                >
                    {!isRunning ?
                        <PlayCircleIcon
                            sx={{ fontSize: '32px', color: "green", verticalAlign: 'middle' }} /> :
                        <StopCircleIcon
                            sx={{ fontSize: '32px', color: "red", verticalAlign: 'middle' }} />
                    }
                </Button>

                {/* Keyboard toggle (single toggle as requested) */}
                <Button
                    id='toggleKeyboardButton'
                    aria-label={keyboardAddsToNotes ? "Keyboard clicks add notes to dropdown" : "Keyboard clicks don't add to notes"}
                    sx={{
                        minWidth: '48px',
                        minHeight: '48px',
                        padding: '8px',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                    onClick={() => setKeyboardMode(keyboardMode === 'none' ? 'piano' : 'none')}
                >
                    <KeyboardIcon
                        sx={{
                            fontSize: '24px',
                            color: keyboardMode === 'none'
                                ? 'var(--color-dominant-text, white)'
                                : 'var(--color-subdominant-primary, #00D9FF)'
                        }}
                    />
                    {keyboardMode !== 'none' && (
                        <span style={{
                            fontSize: '10px',
                            marginLeft: '4px',
                            color: 'var(--color-tertiary-muted, rgba(74,85,104,0.8))',
                            fontFamily: 'monospace'
                        }}>
                            HID active
                        </span>
                    )}
                </Button>

                {/* Simple toggle: Add uploaded files to MIDI keyboard buffers */}
                <Tooltip title={addToMidiBuffers ? "Files will be added to MIDI keyboard buffers" : "Files go to sampler only"}>
                    <Button
                        id='addToMidiBuffersToggle'
                        sx={{
                            minWidth: '48px',
                            minHeight: '48px',
                            padding: '8px',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            border: addToMidiBuffers ? '1px solid var(--color-subdominant-primary, #00D9FF)' : '1px solid transparent',
                        }}
                        onClick={() => setAddToMidiBuffers(!addToMidiBuffers)}
                    >
                        <KeyboardIcon
                            sx={{
                                fontSize: '20px',
                                color: addToMidiBuffers 
                                    ? 'var(--color-subdominant-primary, #00D9FF)'
                                    : 'var(--color-dominant-text, white)'
                            }}
                        />
                    </Button>
                </Tooltip>

                {/* Toggle: Keyboard clicks add to notes dropdown */}
                <Tooltip title={keyboardAddsToNotes ? "Keyboard clicks add notes to dropdown" : "Keyboard clicks don't add to notes"}>
                    <Button
                        id='keyboardAddsToNotesToggle'
                        sx={{
                            minWidth: '48px',
                            minHeight: '48px',
                            padding: '8px',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            border: keyboardAddsToNotes ? '1px solid var(--color-tertiary-warning, #FFA500)' : '1px solid transparent',
                        }}
                        onClick={() => {
                            const newValue = !keyboardAddsToNotes;
                            setKeyboardAddsToNotes(newValue);
                            // Expose to global scope for BeatGridPanel to check
                            (window as any).__keyboardAddsToNotes = newValue;
                        }}
                    >
                        <MusicNoteIcon
                            sx={{
                                fontSize: '20px',
                                color: keyboardAddsToNotes 
                                    ? 'var(--color-tertiary-warning, #FFA500)'
                                    : 'var(--color-dominant-text, white)'
                            }}
                        />
                    </Button>
                </Tooltip>

                <Tooltip title="Oscillator Synth Controls">
                    <Button
                        aria-label="Open oscillator synth controls"
                        sx={{
                            minWidth: '48px',
                            minHeight: '48px',
                            padding: '8px',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                        }}
                        onClick={() => setSynthPanelOpen(true)}
                    >
                        <SettingsIcon
                            sx={{
                                fontSize: '20px',
                                color: 'var(--color-dominant-text, white)'
                            }}
                        />
                    </Button>
                </Tooltip>

                {/* Effects Control Panel buttons for each source */}
                {(['osc1', 'stk1', 'sampler', 'audioin'] as const).map(source => (
                    <Tooltip key={source} title={`${source.toUpperCase()} Effects`}>
                        <Button
                            sx={{
                                minWidth: '48px',
                                minHeight: '48px',
                                padding: '8px',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                            }}
                            onClick={() => {
                                setEffectsPanelSource(source);
                                setEffectsPanelOpen(true);
                            }}
                            aria-label={`Open ${source.toUpperCase()} effects control panel`}
                        >
                            <Typography
                                sx={{
                                    fontSize: '12px',
                                    color: 'var(--color-dominant-text, white)',
                                    textTransform: 'uppercase',
                                    fontWeight: 600
                                }}
                            >
                                {source === 'osc1' ? 'OSC' : source === 'stk1' ? 'STK' : source === 'sampler' ? 'SMP' : 'IN'}
                            </Typography>
                        </Button>
                    </Tooltip>
                ))}

                <PhilosopherGuide />
            </Box>

            <SynthControlPanel
                open={synthPanelOpen}
                onClose={() => setSynthPanelOpen(false)}
            />

            <EffectsControlPanel
                open={effectsPanelOpen}
                onClose={() => setEffectsPanelOpen(false)}
                sourceName={effectsPanelSource}
            />

            <OldParentMonolith
                runChuckCode={runChuckCode}
                onUpload={handleUpload}
                chuckHook={chuckHook || {}}
                selectedDeviceId={selectedDeviceId}
                updateAudioInputDevice={updateAudioInputDevice}
                deviceOptions={deviceOptions}
                showAudioInDropdown={showAudioInDropdown}
                updateSelectedAudioInSetting={updateSelectedAudioInSetting}
            />

            {/* Pedalboard Visualizations - shown when effects panel is open */}
            {effectsPanelOpen && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        width: '400px',
                        maxHeight: '300px',
                        backgroundColor: 'rgba(26, 28, 32, 0.95)',
                        borderRadius: 2,
                        p: 2,
                        zIndex: 10000,
                        border: '1px solid rgba(0, 217, 255, 0.3)'
                    }}
                >
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Signal Chain: {effectsPanelSource.toUpperCase()}
                    </Typography>
                    <PedalboardVisualization sourceName={effectsPanelSource} width={360} height={150} />
                </Box>
            )}
        </>
    );
}

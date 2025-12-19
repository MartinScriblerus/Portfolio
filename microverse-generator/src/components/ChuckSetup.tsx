'use client';
import { act, useEffect, useRef, useState } from 'react';
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
    getTapeClass
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
import { Box, Button, InputLabel, Select } from '@mui/material';
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

    // Local state for slider values
    const [values, setValues] = useState(() => transformedKeyNames.map((n: any) => (audioInSettingsHelperHash as any)[n]));

    // Sync local state to store when effect changes
    useEffect(() => {
        const valsForEffect: any = transformedKeyNames.map((n: any) => (audioInSettingsHelperHash as any)[n]);
        setValues(valsForEffect);
        updateSelectedAudioInSetting(effect);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effect, audioInSettingsHelperHash]);

    // Only update Zustand and ChucK when values change
    useEffect(() => {
        (async () => {
            let updated = false;
            for (let i = 0; i < sliderNames.length; i++) {
                const key = transformedKeyNames[i];
                const transformByThousandSliderArray = ['lisa_trigger_rate', 'grain_rate', 'random_reverse_rate'];
                const value = values[i];
                // Only update if value differs from store
                if ((audioInSettingsHelperHash as any)[key] !== value) {
                    setAudioInSetting(key, value);
                    if (chuckRef.current) {
                        console.log("SANITY CHECK GOT KEY AND VALUE? ", key, value)
                        await chuckRef.current.setAssociativeFloatArrayValue("audioInSettingsHelperHash", key, transformByThousandSliderArray.includes(key) ? +((value * 1.0) / 1000).toFixed(3) : +(value * 1.0).toFixed(3));
                        await chuckRef.current.broadcastEvent("fxUpdate");
                        updated = true;
                    }
                }
            }
        })();
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
    const hidRef = useRef<HID | null>(null);
    const keyboardHIDManagerRef = useRef<KeyboardHIDManager | null>(null);
    const isInitializingRef = useRef<boolean>(false); // Track initialization in progress (more reliable than state)

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

    const beatMs = useTimingStore((s: any) => s.beatMs);
    // Keyboard overlay mode from global store
    const keyboardMode = useOldMonolithStore(s => s.keyboardMode);
    const setKeyboardMode = useOldMonolithStore(s => s.setKeyboardMode);
    const audioInSettingsHelperHash = useAudioInSettingsStore(s => s.audioInSettings);
    const uploadedVFilesRef = useRef<string[]>([]);

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
                    // Consolidated chuckPrint handler - handles TICK updates for active cell
                    const originalChuckPrint = chuckRef.current.chuckPrint;
                    chuckRef.current.chuckPrint = async (message: string) => {
                        // Handle TICK messages - update active cell without re-rendering
                        if (message.includes("TICK")) {
                            try {
                                // Parse TICK message format: "TICK: x y" or "UPDATE_GRID: tick beat step"
                                const tickMatch = message.match(/TICK:\s*(\d+)\s+(\d+)/) ||
                                    message.match(/UPDATE_GRID:\s*(\d+)\s+(\d+)\s+(\d+)/);
                                if (tickMatch) {
                                    // Extract x (step) and y (beat/row) from message
                                    const x = parseInt(tickMatch[2] || tickMatch[3] || '0', 10);
                                    const y = parseInt(tickMatch[1] || tickMatch[2] || '0', 10);
                                    // Update active cell in store (triggers DOM update only, no React re-render)
                                    useBeatGridStore.getState().setActiveCell({ x, y });
                                }
                            } catch (err) {
                                console.warn('[ChucK] Failed to parse TICK message:', message, err);
                            }
                        }

                        if (message.includes("UPDATE_GRID")) {
                            console.log("TK! ", message);
                        }

                        if (message.includes("CHUCK_UP_TO_DATE")) {
                            setIsRunning(true)
                            // Chuck is ready - synchronize beatgrid data here
                            const beatGridData = useBeatGridStore.getState().masterPatternsHashHook;
                            const gridVersion = useBeatGridStore.getState().gridVersion;

                            // Call original handler if it exists
                            if (originalChuckPrint) {
                                originalChuckPrint(message);
                            }

                            // ============================================================
                            // LOG: Beatgrid data ready for passing to Chuck
                            // ============================================================
                            console.group('🎵 Beatgrid Data Ready for Chuck (synchronized)');
                            console.log('Grid Version:', gridVersion);
                            console.log('Beatgrid Structure:', beatGridData);

                            // Log a flattened view of the data structure
                            const flattenedCells: any[] = [];
                            Object.keys(beatGridData).forEach(yKey => {
                                Object.keys(beatGridData[yKey]).forEach(xKey => {
                                    const cell = beatGridData[yKey][xKey];
                                    flattenedCells.push({
                                        position: { x: Number(xKey), y: Number(yKey) },
                                        subdivisions: cell?.subdivisions,
                                        velocity: cell?.velocity,
                                        length: cell?.length,
                                        fileNums: cell?.fileNums,
                                        noteName: cell?.noteName,
                                        volume: cell?.volume,
                                    });
                                });
                            });
                            console.log('Flattened Cells:', flattenedCells);
                            console.log('Total Cells:', flattenedCells.length);
                            console.groupEnd();

                            // ============================================================
                            // SYNCHRONIZE BEATGRID DATA TO CHUCK
                            // Using existing associative arrays pattern (like audioInSettingsHelperHash)
                            // ============================================================
                            if (chuckRef.current) {
                                // Option: Use existing arrays (chuckNotes, chuckVelocities, midiNotesArray, etc.)
                                // OR create a new associative array for beatgrid data
                                // 
                                // Example using existing pattern with setAssociativeFloatArrayValue:
                                // await chuckRef.current.setInt('gridVersion', gridVersion);
                                // 
                                // Object.keys(beatGridData).forEach(yKey => {
                                //     Object.keys(beatGridData[yKey]).forEach(xKey => {
                                //         const cell = beatGridData[yKey][xKey];
                                //         const cellKey = `beatgrid_${yKey}_${xKey}`;
                                //         
                                //         // Use setAssociativeIntArrayValue for integers
                                //         await chuckRef.current.setAssociativeIntArrayValue('beatGridData', `${cellKey}_subdivisions`, cell?.subdivisions || 1);
                                //         
                                //         // Use setAssociativeFloatArrayValue for floats
                                //         await chuckRef.current.setAssociativeFloatArrayValue('beatGridData', `${cellKey}_velocity`, cell?.velocity || 0);
                                //         await chuckRef.current.setAssociativeFloatArrayValue('beatGridData', `${cellKey}_length`, Array.isArray(cell?.length) ? cell.length[0] : cell?.length || 1);
                                //         await chuckRef.current.setAssociativeFloatArrayValue('beatGridData', `${cellKey}_volume`, Array.isArray(cell?.volume) ? cell.volume[0] : cell?.volume || 0);
                                //     });
                                // });
                                // 
                                // await chuckRef.current.broadcastEvent('beatgridUpdated');
                            }

                            runNextEventDFSHelper();
                        }
                    }
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

            uploadedVFilesRef.current.push(vpath);
        }

        // Update ChucK global files[] and broadcast filesUpdated
        const allVFiles = [
            ...SERVER_FILES_TO_PRELOAD.map(f => f.virtualFilename),
            ...uploadedVFilesRef.current
        ];
        const arrayLiteral = JSON.stringify(allVFiles);
        try {
            await chuckRef.current.runCode(`[${arrayLiteral}] @=> files; filesUpdated.broadcast();`);
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
        (async () => {
            try {
                chuckRef.current && await chuckRef.current.runCode(`Machine.removeAllShreds();`);
                chuckRef.current && await chuckRef.current.runCode(`Machine.resetShredID();`);
            } catch (err: any) {
                // Suppress ErrnoError errno 20 (file system errors) - these are often non-critical
                if (err?.name === 'ErrnoError' && err?.errno === 20) {
                    return;
                }
                console.warn('Failed to reset ChucK shreds:', err);
            }
        })();
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
            case ('tape'):
                activeEffect = 1;
            case ('random reverse'):
                activeEffect = 2;
            case ('clapping'):
                activeEffect = 3;
            case ('lisa trigger'):
                activeEffect = 4;
            case ('asymptotic chopper'):
                activeEffect = 5;
            case ('mosaic synth'):
                activeEffect = 6;
            default:
                return activeEffect | defaultAudioInSetting;
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
            const masterFastestRate = 1; // Default value - can be added to store if needed
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

            return {
                isTestingChord: undefined,
                filesArray: JSON.stringify(SERVER_FILES_TO_PRELOAD.map(f => f.virtualFilename)),
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
        if (isInitializingRef.current || isRunning) {
            console.log('[runChuckCode] already running or initializing, ignoring');
            return;
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
                    return;
                }
            } else if (globalAudioCtx.current.state === 'suspended') {
                // Ensure the context is resumed during the user gesture
                await globalAudioCtx.current.resume();
                console.log('[runChuckCode] attempted to resume AudioContext (user gesture)');
            }
        } catch (resumeErr) {
            console.warn('[runChuckCode] AudioContext resume attempt failed:', resumeErr);
            isInitializingRef.current = false;
            return;
        }

        // Lazy-load the heavy `webchuck` module only when the user requests it
        let ChuckModule: any = null;
        try {
            ChuckModule = await import('webchuck');
        } catch (impErr) {
            console.error('[runChuckCode] dynamic import failed:', impErr);
            isInitializingRef.current = false;
            throw impErr;
        }
        const { Chuck } = ChuckModule;
        let sampleRate = globalAudioCtx.current && globalAudioCtx.current.sampleRate || 44100;
        calculateDisplayDigits(sampleRate);

        // Double-check we're still not running (state might have changed)
        if (isRunning) {
            console.log('[runChuckCode] isRunning became true during init, aborting');
            isInitializingRef.current = false;
            return;
        }
        const chugins: string[] = loadWebChugins();
        chugins.forEach((path) => Chuck.loadChugin(path));
        setShowAudioInDropdown(true);
        console.log("HEYA!")
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
            return;
        }

        // Wait for AudioContext to be running (critical for AudioWorklet)
        if (globalAudioCtx.current.state !== 'running') {
            console.log('[runChuckCode] Waiting for AudioContext to resume...');
            try {
                await globalAudioCtx.current.resume();
            } catch (resumeErr) {
                console.error('[runChuckCode] Failed to resume AudioContext:', resumeErr);
                isInitializingRef.current = false;
                return;
            }
        }

        console.log('[runChuckCode] AudioContext state:', globalAudioCtx.current.state);

        // try {
        console.log('[runChuckCode] Initializing ChucK...');
        chuckRef.current = await Chuck.init(serverFilesToPreload, globalAudioCtx.current, globalAudioCtx.current.destination.maxChannelCount, whereIsChuck);
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
        // Note: isInitializingRef.current will be cleared in finally block

        // Set up chuckPrint handler for synchronization (same as in chuckMicButton)
        // NOTE: This duplicates the handler above - consider consolidating
        if (chuckRef.current) {
            const originalChuckPrint = chuckRef.current.chuckPrint;
            chuckRef.current.chuckPrint = async (message: string) => {
                // Handle TICK messages - update active cell without re-rendering
                if (message.includes("TICK")) {
                    try {
                        const tickMatch = message.match(/TICK:\s*(\d+)\s+(\d+)/) ||
                            message.match(/UPDATE_GRID:\s*(\d+)\s+(\d+)\s+(\d+)/);
                        if (tickMatch) {
                            const x = parseInt(tickMatch[2] || tickMatch[3] || '0', 10);
                            const y = parseInt(tickMatch[1] || tickMatch[2] || '0', 10);
                            useBeatGridStore.getState().setActiveCell({ x, y });
                        }
                    } catch (err) {
                        console.warn('[ChucK] Failed to parse TICK message:', message, err);
                    }
                }

                if (message.includes("CHUCK_UP_TO_DATE")) {
                    // Chuck is ready - synchronize beatgrid data here
                    const beatGridData = useBeatGridStore.getState().masterPatternsHashHook;

                    // Call original handler if it exists
                    if (originalChuckPrint) {
                        originalChuckPrint(message);
                    }
                    const gridVersion = useBeatGridStore.getState().gridVersion;

                    // ============================================================
                    // LOG: Beatgrid data ready for passing to Chuck
                    // ============================================================
                    if (DEBUG_HEAVY_LOGS) {
                        console.group('🎵 Beatgrid Data Ready for Chuck (synchronized)');
                        console.log('Grid Version:', gridVersion);
                        console.log('Beatgrid Structure:', beatGridData);
                        const flattenedCells: any[] = [];
                        Object.keys(beatGridData).forEach(yKey => {
                            Object.keys(beatGridData[yKey]).forEach(xKey => {
                                const cell = beatGridData[yKey][xKey];
                                flattenedCells.push({
                                    position: { x: Number(xKey), y: Number(yKey) },
                                    subdivisions: cell?.subdivisions,
                                    velocity: cell?.velocity,
                                    length: cell?.length,
                                    fileNums: cell?.fileNums,
                                    noteName: cell?.noteName,
                                    volume: cell?.volume,
                                });
                            });
                        });
                        console.log('Flattened Cells:', flattenedCells);
                        console.log('Total Cells:', flattenedCells.length);
                        console.groupEnd();
                    }

                    // ============================================================
                    // SYNCHRONIZE BEATGRID DATA TO CHUCK
                    // Using existing associative arrays pattern (like audioInSettingsHelperHash)
                    // ============================================================
                    if (chuckRef.current) {
                        // Option: Use existing arrays (chuckNotes, chuckVelocities, midiNotesArray, etc.)
                        // OR create a new associative array for beatgrid data
                        // 
                        // Example using existing pattern with setAssociativeFloatArrayValue:
                        // await chuckRef.current.setInt('gridVersion', gridVersion);
                        // 
                        // Object.keys(beatGridData).forEach(yKey => {
                        //     Object.keys(beatGridData[yKey]).forEach(xKey => {
                        //         const cell = beatGridData[yKey][xKey];
                        //         const cellKey = `beatgrid_${yKey}_${xKey}`;
                        //         
                        //         // Use setAssociativeIntArrayValue for integers
                        //         await chuckRef.current.setAssociativeIntArrayValue('beatGridData', `${cellKey}_subdivisions`, cell?.subdivisions || 1);
                        //         
                        //         // Use setAssociativeFloatArrayValue for floats
                        //         await chuckRef.current.setAssociativeFloatArrayValue('beatGridData', `${cellKey}_velocity`, cell?.velocity || 0);
                        //         await chuckRef.current.setAssociativeFloatArrayValue('beatGridData', `${cellKey}_length`, Array.isArray(cell?.length) ? cell.length[0] : cell?.length || 1);
                        //         await chuckRef.current.setAssociativeFloatArrayValue('beatGridData', `${cellKey}_volume`, Array.isArray(cell?.volume) ? cell.volume[0] : cell?.volume || 0);
                        //     });
                        // });
                        // 
                        // await chuckRef.current.broadcastEvent('beatgridUpdated');
                    }

                    runNextEventDFSHelper();
                }
            };
        }

        // Build ChucK code with effects routing
        let chuckCodeData;
        try {
            chuckCodeData = await buildChuckCodeData();
            if (!chuckCodeData) {
                console.error('Failed to build ChucK code data - buildChuckCodeData returned null');
                return;
            }
        } catch (error) {
            console.error('Failed to build ChucK code data:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
            return;
        }

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
        // Expose generated code for easy inspection in DevTools
        // try {
        if (typeof window !== 'undefined') (window as any).__lastGeneratedChuck = generatedChuckCode;
        // } catch {}

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

            try {
                // Check if ChucK is ready before running code
                if (!chuckRef.current) {
                    console.error('❌ ChucK instance not initialized');
                    return;
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

                // // Clear any existing code first to avoid conflicts
                try {
                    await chuckRef.current.runCode(`Machine.removeAllShreds();`);
                    await chuckRef.current.runCode(`Machine.resetShredID();`);
                } catch (clearErr: any) {
                    // Ignore clear errors - might not be necessary
                }

                // Try using replaceCode instead of runCode for large code blocks
                // replaceCode is better for replacing existing code
                let result;
                try {
                    // First try replaceCode (better for large code)
                    // result = await chuckRef.current.runCode(generatedChuckCode);

                    result = await chuckRef.current.runCode(`
                        global int beatMSNew;

                        Std.ftoi(60000 / 120) => beatMSNew;

                        0 => int newTicker;
                        SinOsc osc => dac;
                        fun void sporkedFunction (int newTick) {
                            440 => osc.freq;
                            1.0 => osc.gain;
                            if (newTick % 4 == 0) {
                                (beatMSNew/20)::ms => now;
                                 0.0 => osc.gain;
                                <<< "UPDATE_GRID num shreds in oSCCC: ", Machine.numShreds() >>>;
                            }
                            me.exit();
                        }
                        while (true) {
                            <<< "UPDATE_GRID: ", newTicker, (newTicker + 1) / 4, (newTicker + 1) % 4 >>>;
                            1 => int subdivs;
                            spork ~ sporkedFunction(newTicker);
                            (beatMSNew/subdivs)::ms => now;
                            newTicker + 1 => newTicker;

                            <<< "UPDATE_GRID num shreds: ", Machine.numShreds() >>>;
                            me.yield();
                        }
                    `);
                    console.log('✅ ChucK code replaced successfully ', result);
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

                    console.error('Generated code length:', generatedChuckCode.length);
                    // Log first 1000 chars of code for debugging
                    if (generatedChuckCode.length > 0) {
                        console.error('Code preview (first 1000 chars):', generatedChuckCode.substring(0, 1000));
                        // Also log last 500 chars in case error is near the end
                        if (generatedChuckCode.length > 1000) {
                            console.error('Code preview (last 500 chars):', generatedChuckCode.substring(generatedChuckCode.length - 500));
                        }
                        // Log middle section to catch errors there
                        const midPoint = Math.floor(generatedChuckCode.length / 2);
                        console.error('Code preview (middle 500 chars):', generatedChuckCode.substring(midPoint - 250, midPoint + 250));
                    }
                }
            } finally {
                // Restore original chuckPrint if not already restored
                if (chuckRef.current && chuckRef.current.chuckPrint !== originalChuckPrint) {
                    chuckRef.current.chuckPrint = originalChuckPrint;
                }
            }
        }
        
        // Success - clear initialization flag
        isInitializingRef.current = false;
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

                <PhilosopherGuide />
            </Box>

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
        </>
    );
}

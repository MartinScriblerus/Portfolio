'use client';
import { act, useEffect, useRef, useState } from 'react';
import { Chuck } from 'webchuck';
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
import '../../app/globals.css';
import { useAudioInSettingsStore } from '../utils/audioInSettingsHelper';
import { audioInEffectSlidersHelper } from '../utils/utils';
import { calculateDisplayDigits, loadWebChugins } from '../utils/audioClient';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MicOffIcon from '@mui/icons-material/MicOff';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { Box, Button, InputLabel, Select } from '@mui/material';
import { filesToProcess, chuckRef as globalChuckRef, moogGrandmotherEffects, universalSources, activeSTKDeclarations, activeSTKSettings, activeSTKPlayOn, activeSTKPlayOff } from '../../app/state/refs';
import '../../app/globals.css';
import OldParentMonolith from '../components/OldParentMonolith/OldParentMonolith';
import { Tune } from "../tune";
import { useRhythmCache } from '../hooks/useRhythmCache';
import { getChuckCode, buildSourceData, processSourceFX, createEmptyTargets } from '../utils/chuckHelper';

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

// function EffectDropdown({ chuckRef, updateSelectedAudioInSetting, showAudioInDropdown }: FxDropProps) {
//     const [open, setOpen] = useState(false);
//     const [selected, setSelected] = useState<string | null>(null);
//     const [minimizeAudioInDropdown, setMinimizeAudioInDropdown] = useState(false);

//     return (
//         <div style={{ width: '100%' }}>
//             <div
//                 style={{
//                     padding: '10px 12px',
//                     cursor: 'pointer',
//                     borderBottom: '1px solid rgba(255,255,255,0.12)',
//                     userSelect: 'none',
//                     background: 'royalblue'
//                 }}
//                 onClick={() => {
//                     if (selected === '' && !minimizeAudioInDropdown) {
//                         setMinimizeAudioInDropdown(true);
//                     } else {
//                         setMinimizeAudioInDropdown(false);
//                     }
//                     setSelected('');
//                 }}
//             >
//                 {selected || 'Select Effect'}
//                 <span
//                     className="effects-dropdown-arrow"
//                     style={{
//                         rotate: selected ? '180deg' : '0deg',
//                     }}
//                 >
//                     ▼
//                 </span>
//             </div>

//             {!minimizeAudioInDropdown && (
//                 <div className="effects-dropdown-wrapper">
//                     {EFFECTS.map(effect => (
//                         <div
//                             key={effect}
//                             className="effects-dropdown-item"
//                             style={{
//                                 background:
//                                     selected === effect ? 'rgba(255,255,255,0.10)' : 'transparent',
//                             }}
//                             onClick={() => {
//                                 // updateSelectedAudioInSetting
//                                 setSelected(effect);
//                                 setOpen(!open);
//                                 updateSelectedAudioInSetting(effect);
//                             }}
//                         >
//                             {effect}
//                             {selected === effect && (
//                                 <EffectSliders
//                                     effect={selected}
//                                     chuckRef={chuckRef}
//                                     updateSelectedAudioInSetting={updateSelectedAudioInSetting}
//                                 />
//                             )}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }

// function EffectSliders({ effect, chuckRef, updateSelectedAudioInSetting }: { 
//     effect: string, 
//     chuckRef: any, 
//     updateSelectedAudioInSetting: any 
// }) {
//     const audioInSettingsHelperHash = useAudioInSettingsStore(s => s.audioInSettings);
//     const setAudioInSetting = useAudioInSettingsStore(s => s.setAudioInSetting);
//     const sliderNames = audioInEffectSlidersHelper(effect);
//     const transformedKeyNames: string[] = sliderNames.map(name =>
//         `${effect.trim().toLowerCase().replace(' ', '_')}_${name.name.trim().toLowerCase().replace(' ', '')}`
//     );

//     // Local state for slider values
//     const [values, setValues] = useState(() => transformedKeyNames.map((n: any) => (audioInSettingsHelperHash as any)[n]));

//     // Sync local state to store when effect changes
//     useEffect(() => {
//         const valsForEffect: any = transformedKeyNames.map((n: any) => (audioInSettingsHelperHash as any)[n]);
//         setValues(valsForEffect);
//         updateSelectedAudioInSetting(effect);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [effect, audioInSettingsHelperHash]);

//     // Only update Zustand and ChucK when values change
//     useEffect(() => {
//         (async () => {
//             let updated = false;
//             for (let i = 0; i < sliderNames.length; i++) {
//                 const key = transformedKeyNames[i];
//                 const transformByThousandSliderArray = ['lisa_trigger_rate', 'grain_rate', 'random_reverse_rate'];
//                 const value = values[i];
//                 // Only update if value differs from store
//                 if ((audioInSettingsHelperHash as any)[key] !== value) {
//                     setAudioInSetting(key, value);
//                     if (chuckRef.current) {
//                         console.log("SANITY CHECK GOT KEY AND VALUE? ", key, value)
//                         await chuckRef.current.setAssociativeFloatArrayValue("audioInSettingsHelperHash", key, transformByThousandSliderArray.includes(key) ? +((value * 1.0) / 1000).toFixed(3) : +(value * 1.0).toFixed(3));
//                         await chuckRef.current.broadcastEvent("fxUpdate");
//                         updated = true;
//                     }
//                 }
//             }
//         })();
//     // Only run when values change, not when store changes
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [values]);

//     return (
//         <div style={{ padding: '12px 8px 8px 8px', background: 'rgba(0,0,0,0.10)', borderRadius: 4 }}>
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>{effect} Controls</div>
//             {sliderNames.map((name, i) => (
//                 <div key={name.name} style={{ marginBottom: 10 }}>
//                     <label style={{ fontSize: 13, color: '#e9f1ff', marginBottom: 2, display: 'block' }}>
//                         {name.name}
//                     </label>
//                     <input
//                         type="range"
//                         min={name.min}
//                         max={name.max}
//                         value={values[i]}
//                         onChange={e => {
//                             const v = Number(e.target.value);
//                             setValues((vals: any) => {
//                                 const newVals = vals.map((val: any, idx: number) => (idx === i ? v : val));
//                                 console.log(`[EffectSliders] setValues: index ${vals[i]} changed to`, v, "New values:", newVals);
//                                 return newVals;
//                             });
//                         }}
//                         style={{ zIndex: 99999, width: 180, accentColor: '#6cf', height: 4 }}
//                     />
//                     <span style={{ marginLeft: 10, fontSize: 12, color: '#b7d6ff' }}>{values[i]}</span>
//                 </div>
//             ))}
//         </div>
//     );
// }

// -----------------------------
// Main Component
// -----------------------------
export default function ChuckSetup() {
    const chuckRef = useRef<Chuck | null>(null);
    const [ready, setReady] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [audioInSelected, setAudioInSelected] = useState<string>('');
    const [deviceOptions, setDeviceOptions] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [chuckHook, setChuckHook] = useState<Chuck | any>({});

    const isRunning = useRef(false);
    const currentStreamRef = useRef<MediaStream | null>(null);
    const currentSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const beatMs = useTimingStore((s: any) => s.beatMs);
    const audioInSettingsHelperHash = useAudioInSettingsStore(s => s.audioInSettings);
    const uploadedVFilesRef = useRef<string[]>([]);

    const globalAudioCtx = useRef<AudioContext | null>(null);


    // Access the rhythm cache - note: this creates a separate instance
    // To access values from BeatGridPanel's cache, we'll use stores directly
    const { cacheRef } = useRhythmCache({ 
        filesToProcess: filesToProcess?.current || [], 
        tune: null // Can be passed from parent if available
    });
    
    /**
     * Helper to safely extract cache context values with fallbacks
     * 
     * Usage:
     *   const context = getCacheContext();
     *   const bpm = context.bpm;
     *   const mTFreqs = context.mTFreqs;
     * 
     * All values are safely accessed with fallbacks to stores or defaults.
     * The cache context contains values passed from BeatGridPanel:
     *   - mTFreqs, mTMidiNums: Microtonal frequencies and MIDI numbers
     *   - bpm: Beats per minute (from timing store if not in cache)
     *   - numeratorSignature, denominatorSignature: Time signature
     *   - notesHolder: Current note values
     *   - masterFastestRate: Fastest playback rate
     *   - selectedChordScaleOctaveRange: Chord/scale/octave selection
     */
    const getCacheContext = () => {
        const context = cacheRef.current?.context;
        const timingStore = useTimingStore.getState() as any;
        const bpmFromStore = timingStore?.bpm || 120;
        const beatMsFromStore = timingStore?.beatMs || 500;
        const beatGridStore = useBeatGridStore.getState();
        
        return {
            // From cache context (if available) or fallback to stores/defaults
            mTFreqs: context?.mTFreqs || [],
            mTMidiNums: context?.mTMidiNums || [],
            bpm: context?.bpm || bpmFromStore || 120,
            numeratorSignature: context?.numeratorSignature || 4,
            denominatorSignature: context?.denominatorSignature || 4,
            notesHolder: context?.notesHolder || beatGridStore.currentNoteVals || null,
            masterFastestRate: context?.masterFastestRate || 4,
            selectedChordScaleOctaveRange: context?.selectedChordScaleOctaveRange || null,
            // Additional useful values
            beatMs: beatMsFromStore || 500,
        };
    };

    useEffect(() => {
        if (!globalAudioCtx.current) {
            globalAudioCtx.current = new AudioContext();
        }
        return () => {
            globalAudioCtx.current?.close();
            globalAudioCtx.current = null;
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
    const loadWasm = new Promise(function (resolve, reject) {
        asyncLoadFile('/webchuck/webchuck.wasm', resolve, reject);
    });

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
        theWasm = await loadWasm;
        console.log("here!")
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
                    chuckRef.current.chuckPrint = async (message: string) => {
                        if (message.includes("TICK")) {
                            const parsedMsg = message.split(":")[1].trim();

                            // setChuckMsg(parsedMsg); 
                            console.log("msg is... --> ", message);
                        }

                        if (message.includes("CHUCK_UP_TO_DATE")) {
                            // Chuck is ready - synchronize beatgrid data here
                            const beatGridData = useBeatGridStore.getState().masterPatternsHashHook;
                            const gridVersion = useBeatGridStore.getState().gridVersion;

                            // ============================================================
                            // LOG: Beatgrid data ready for passing to Chuck
                            // ============================================================
                            // console.group('🎵 Beatgrid Data Ready for Chuck (synchronized)');
                            // console.log('Grid Version:', gridVersion);
                            // console.log('Beatgrid Structure:', beatGridData);

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
                            // console.log('Flattened Cells:', flattenedCells);
                            console.log('Total Cells:', flattenedCells.length);
                            // console.groupEnd();

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
        } catch (err) {
            console.warn('Failed to update files[] in ChucK', err);
        }

        // e.target.value = '';
    }

    const beatInMilliseconds = useTimingStore((s: any) => s.beatMs);


    const chuckInstructions = `

        <<< "BEATCOUNT SANITY CHECK " >>>;

        ${filesArray} @=> string files[];


        // Global variables and events
        global Event playNote;
        global Event playSingleNote;

        global Event releaseSingleNote;
        global Event playSTK;
        global Event startMeasure;
        global Event playAudioIn;
        global Event fxUpdate;
        global Event stkInstFxUpdate;
        global float bpm; 
        bpm => float bpmInit;

        global float chuckNotes[0];
        global float chuckNotesOff[0];

        global float chuckVelocities[0];

        global float midiNotesArray[0];
        global float midiFreqsArray[0];
        global float midiLengthsArray[0];
        global float midiVelocitiesArray[0];

        global float moogGMDefaults[0]; 
        global float effectsDefaults[0];  
        global float stkEffectsDefaults[0];  
        global int allFXDynamicInts[0];
        global int allSTKFXDynamicInts[0];
        global float allFXDynamicFloats[0];
        global float allSTKFXDynamicFloats[0];

        global int numeratorSignature;
        global int denominatorSignature;

        // 0.5 => global float osc1MasterGain;
        // 0.5 => global float samplerMasterGain;
        // 0.5 => global float audioInMasterGain;
        // 0.5 => global float stkMasterGain;

        global float audioMixer_Osc1[0];
        global float audioMixer_Stk1[0]; 
        global float audioMixer_Sampler[0]; 
        global float audioMixer_AudioIn[0];  



        global int beatCount;
        0 => beatCount;
        global int stepCount;
        0 => stepCount;
        global int stepsPerBeat;
        4 => stepsPerBeat;

        global float audioInSettingsHelperHash[0];
        
        global int BeatMsInts;
        // ${beatMs} => BeatMsInts;
        1 => BeatMsInts;
        global int activeEffect;
        2 => activeEffect;
        -1 => int lastEffect; 


        ${getGrainStretchClass(
            beatMs,
        )}

        ${getTapeClass(
            beatMs,
        )}

        ${getRandomReverseClass(
            beatMs,
        )}
        
        ${getReichClass(
            beatMs,
        )}

        1 => audioInSettingsHelperHash["grain_stretch"];
        ${audioInSettingsHelperHash['grain_rate']} / 1000 => audioInSettingsHelperHash["grain_rate"];
        ${audioInSettingsHelperHash['grain_length']} => audioInSettingsHelperHash["grain_length"];
        ${audioInSettingsHelperHash['grain_grains']} => audioInSettingsHelperHash["grain_grains"];
        
        ${audioInSettingsHelperHash['tape_delaylength']} => audioInSettingsHelperHash["tape_delaylength"];
        ${audioInSettingsHelperHash['tape_loop']} => audioInSettingsHelperHash["tape_loop"];
        1.0 => audioInSettingsHelperHash["tape_gain"];

        ${audioInSettingsHelperHash['random_reverse_influence']} => audioInSettingsHelperHash["random_reverse_influence"];
        ${audioInSettingsHelperHash['random_reverse_rate']} / 1000 => audioInSettingsHelperHash["random_reverse_rate"];
        ${audioInSettingsHelperHash['random_reverse_maxbufferlength']} / 1000 => audioInSettingsHelperHash["random_reverse_maxbufferlength"];
        ${audioInSettingsHelperHash['random_reverse_envelopeduration']} / 1000 => audioInSettingsHelperHash["random_reverse_envelopeduration"];


        ${audioInSettingsHelperHash["clapping_length"]} => audioInSettingsHelperHash["clapping_length"];
        ${audioInSettingsHelperHash["clapping_voices"]} => audioInSettingsHelperHash["clapping_voices"];
        ${audioInSettingsHelperHash["clapping_speed"]} => audioInSettingsHelperHash["clapping_speed"];
        ${audioInSettingsHelperHash["clapping_maxbuffer"]} => audioInSettingsHelperHash["clapping_maxbuffer"];


        GrainStretch grain;
        Tape tape;
        RandomReverse rr;
        Reich rei;
        // LisaTrigger lisaTrigger;


        fun void fxUpdateHandler(Event e) {
            while (true) {
                e => now;
                if (activeEffect == 0) {
                    // grain.stretch(audioInSettingsHelperHash["grain_stretch"]);
                    grain.rate(audioInSettingsHelperHash["grain_rate"]);
                    grain.length(Std.ftoi(audioInSettingsHelperHash["grain_length"])::ms);
                    grain.grains(Std.ftoi(audioInSettingsHelperHash["grain_grains"]));
                } else if (activeEffect == 1) {
                 if (audioInSettingsHelperHash["tape_delaylength"] > 600.0) {
                    600.0 => audioInSettingsHelperHash["tape_delaylength"];
                 }
                    tape.delayLength(Std.ftoi(audioInSettingsHelperHash["tape_delaylength"])::ms);
                    tape.loop(Std.ftoi(audioInSettingsHelperHash["tape_loop"]));
                } else if (activeEffect == 2) {
                    rr.setInfluence(audioInSettingsHelperHash["random_reverse_influence"]);
                    rr.setReverseGain(audioInSettingsHelperHash["random_reverse_rate"]);
                    rr.setMaxBufferLength(Std.ftoi(audioInSettingsHelperHash["random_reverse_maxbufferlength"])::ms);
                } else if (activeEffect == 3) {
                    rei.speed(audioInSettingsHelperHash["clapping_speed"]);
                    // rei.length(Std.ftoi(audioInSettingsHelperHash["clapping_length"])::ms);
                    rei.voices(Std.ftoi(audioInSettingsHelperHash["clapping_voices"]));
                    // rei.maxBuffer(Std.ftoi(audioInSettingsHelperHash["clapping_maxbuffer"]));
                } 
                // else if (activeEffect == 4) {
                // } 
                else {
                }
            }
        }

        // spork ~fxUpdateHandler(fxUpdate);


        while (true) {      
            // if (activeEffect == 0) {
            //     adc => grain => dac;
            // } else if (activeEffect == 1) {
            //     adc => tape => dac;
            // } else if (activeEffect == 2) {
            //     adc => rr => dac;
            //     rr.setInfluence(1.0);
            //     rr.listen(1);
            // } else if (activeEffect == 3) {            
            //     adc => rei => dac;
            // } else {
            //     adc =< tape;
            //     adc =< rr;
            //     adc =< rei;
            //     adc =< grain;
            // }

            // activeEffect => int lastActiveEffect;
            // while ( activeEffect == lastActiveEffect) {
    

            // if (activeEffect != lastActiveEffect) {
            //     Machine.removeAllShreds();
            //     Machine.resetShredID();
            // }

            // <<< "ACTIVE_EFFECT: ", activeEffect >>>;
            // <<< "SHREDCOUNT: ", Machine.numShreds() >>>;
            // <<< "TICK: ", now >>>;


            Std.ftoi(stepCount / 4) => int colCount;
            Std.ftoi((4 * numeratorSignature * colCount) % stepCount) => int rowCount;


            <<< "TICK BEFORE ", colCount, rowCount >>>;
            (BeatMsInts)::ms => now;
            // 1000::ms => now;
            <<< "CHUCK_UP_TO_DATE: ", BeatMsInts, stepCount, beatCount >>>;
            stepCount++;

            if (stepCount % stepsPerBeat == 0) {
                beatCount++;
                0 => stepCount;
                <<< "SHREDCOUNT: ", Machine.numShreds() >>>;
                <<< "TICK ??: ", now >>>;    
                <<< "BEATCOUNT: ", beatCount >>>;
            } else {
                <<< "TICK IN THE ELSE " >>>;
            }



        // }
        1::samp => now;
    }
    `;


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
            chuckRef.current && await chuckRef.current.runCode(`Machine.removeAllShreds();`);
            chuckRef.current && await chuckRef.current.runCode(`Machine.resetShredID();`);
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

    const runChuckCode = async () => {
        
        let sampleRate = globalAudioCtx.current && globalAudioCtx.current.sampleRate || 44100;
        calculateDisplayDigits(sampleRate);
        if (isRunning.current) return;
        const chugins: string[] = loadWebChugins();
        chugins.forEach((path) => Chuck.loadChugin(path));
        setShowAudioInDropdown(true);
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

       
        chuckRef.current = globalAudioCtx.current && await Chuck.init(serverFilesToPreload, globalAudioCtx.current, globalAudioCtx.current.destination.maxChannelCount, whereIsChuck);
        // Expose the running ChucK instance globally for Old-* components
        if (chuckRef.current) {
            globalChuckRef.current = chuckRef.current as any;
        }
        chuckRef.current && globalAudioCtx.current && await chuckRef.current.connect(globalAudioCtx.current.destination);



        console.log("WebChucK initialized with live mic input ", chuckRef.current);

        setInitializing(true);

        // Set up chuckPrint handler for synchronization (same as in chuckMicButton)
        if (chuckRef.current) {
            chuckRef.current.chuckPrint = async (message: string) => {
                if (message.includes("BEATCOUNT")) {
                    const parsedMsg = message.split(":")[1].trim();
                    console.log("beatcount msg is... --> ", parsedMsg);
                }

                if (message.includes("CHUCK_UP_TO_DATE")) {
                    console.log("chuck up to date msg is... --> ", message);
                    // Chuck is ready - synchronize beatgrid data here
                    const beatGridData = useBeatGridStore.getState().masterPatternsHashHook;
                    const gridVersion = useBeatGridStore.getState().gridVersion;

                    // ============================================================
                    // LOG: Beatgrid data ready for passing to Chuck
                    // ============================================================
                    // console.group('🎵 Beatgrid Data Ready for Chuck (synchronized)');
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
            };
        }

        console.log("SANITY CHUCK DEBUG: ", chuckInstructions);
        if (chuckRef.current && filesArray?.length > 0) {
            const beatGridData = useBeatGridStore.getState().masterPatternsHashHook || {};
            
            // Safely check if beatGridData is valid before processing
            if (!beatGridData || typeof beatGridData !== 'object') {
                console.warn('[ChuckSetup] beatGridData is invalid:', beatGridData);
                return;
            }
            
            // Log a flattened view of the data structure
            const flattenedCells: any[] = [];
            try {
                Object.keys(beatGridData).forEach(yKey => {
                    const row = beatGridData[yKey];
                    if (!row || typeof row !== 'object') return;
                    Object.keys(row).forEach(xKey => {
                        const cell = row[xKey];
                        if (!cell) return;
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
            } catch (err) {
                console.error('[ChuckSetup] Error processing beatGridData:', err);
            }
            console.log('Flattened Cells !@#$:', flattenedCells);
            
            // Safely extract all context values with fallbacks
            const context = getCacheContext();
            
            // Wrap beatGridData in a ref-like object since chuckHelper expects .current property
            const masterPatternsRefLike = { current: beatGridData };
            
            // Safely extract currentNoteVals from beatGridData - needs to match expected structure
            // currentNoteVals should be an object with osc1, sampler, etc. properties, not a flat array
            // For now, create a safe structure that matches what getChuckCode expects
            const currentNoteValsSafe = (() => {
                try {
                    // Try to extract from beatGridData or use context values
                    // If currentNoteVals needs osc1[0] structure, create it from context
                    const masterRate = context.masterFastestRate || 4;
                    return {
                        osc1: [masterRate],
                        // Add other expected properties as needed
                    };
                } catch (err) {
                    console.error('[ChuckSetup] Error creating currentNoteValsSafe:', err);
                    return { osc1: [4] }; // Default fallback
                }
            })();

            // Build signal chain data for each source using buildSourceData
            // Helper function to safely build source data
            const emptySourceData = { signalChain: [], signalChainDeclarations: [], valuesReadout: {}, valuesReadoutDeclarations: {} };
            const safeBuildSourceData = (sourceName: 'osc1' | 'sampler' | 'stk1' | 'audioin') => {
                if (!universalSources.current) {
                    return emptySourceData;
                }
                try {
                    // Use type assertion to bypass TypeScript's strict type checking
                    // buildSourceData expects keyof typeof universalSources.current, but TypeScript
                    // can't infer this when current might be undefined
                    return (buildSourceData as any)(sourceName);
                } catch (err) {
                    console.error(`[ChuckSetup] Error building source data for ${sourceName}:`, err);
                    return emptySourceData;
                }
            };
            
            const osc1Data = safeBuildSourceData('osc1');
            const samplerData = safeBuildSourceData('sampler');
            const stkData = safeBuildSourceData('stk1');
            const audioInData = safeBuildSourceData('audioin');

            // Create getSourceFX function that returns FX code for each source
            // This is called synchronously in the template string, so it must be synchronous
            // The actual FX processing happens via buildSourceData above
            const getSourceFX = (sourceKey: 'osc1' | 'sampler' | 'stk' | 'audioin'): string => {
                // Return empty string - the actual FX chains are built via buildSourceData
                // and included in signalChainDeclarations which are passed separately
                // This function is just for any additional FX code that needs to be injected
                return '';
            };

            // Calculate maxMinFreq from context if available
            const maxMinFreq = context.mTFreqs && context.mTFreqs.length > 0
                ? { min: Math.min(...context.mTFreqs), max: Math.max(...context.mTFreqs) }
                : undefined;

            try {
                const chuckCode = getChuckCode(
                undefined, // isTestingChord
                filesArray,
                currentNoteValsSafe, // currentNoteVals (object with osc1, etc.)
                masterPatternsRefLike, // masterPatternsRef (wrapped in ref-like object)
                context.masterFastestRate, // masterFastestRate
                
                context.numeratorSignature, // numeratorSignature
                context.denominatorSignature, // denominatorSignature
                context.bpm, // bpm
                moogGrandmotherEffects, // moogGrandmotherEffects (from refs)
                osc1Data.signalChain, // signalChain
                osc1Data.signalChainDeclarations, // signalChainDeclarations
                samplerData.signalChain, // signalChainSampler
                samplerData.signalChainDeclarations, // signalChainSamplerDeclarations
                stkData.signalChain, // signalChainSTK
                stkData.signalChainDeclarations, // signalChainSTKDeclarations
                audioInData.signalChain, // signalChainAudioIn
                audioInData.signalChainDeclarations, // signalChainAudioInDeclarations
                osc1Data.valuesReadout, // valuesReadout
                samplerData.valuesReadout, // valuesReadoutSampler
                stkData.valuesReadout, // valuesReadoutSTK
                audioInData.valuesReadout, // valuesReadoutAudioIn
                osc1Data.valuesReadoutDeclarations, // valuesReadoutDeclarations
                samplerData.valuesReadoutDeclarations, // valuesReadoutSamplerDeclarations
                stkData.valuesReadoutDeclarations, // valuesReadoutSTKDeclarations
                audioInData.valuesReadoutDeclarations, // valuesReadoutAudioInDeclarations
                getSourceFX, // getSourceFX
                context.mTFreqs, // mTFreqs
                activeSTKDeclarations.current, // activeSTKDeclarations
                activeSTKSettings.current, // activeSTKSettings
                activeSTKPlayOn.current, // activeSTKPlayOn
                activeSTKPlayOff.current, // activeSTKPlayOff
                context.selectedChordScaleOctaveRange, // selectedChordScaleOctaveRange
                maxMinFreq, // maxMinFreq
                context.notesHolder ? { current: context.notesHolder } : null, // notesHolder (wrap in ref-like object if needed)
                null, // hid (TODO: get from MIDI access if available)
                );
                
                console.log('[ChuckSetup] Generated ChucK code length:', chuckCode.length);
                // console.log('[ChuckSetup] First 500 chars of ChucK code:', chuckCode.substring(0, 500));
                
                await chuckRef.current.runCode(chuckCode);
                console.log('[ChuckSetup] ChucK code executed successfully');
            } catch (err) {
                console.error('[ChuckSetup] Error running ChucK code:', err);
                console.error('[ChuckSetup] Error details:', {
                    message: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined
                });
                throw err; // Re-throw to see the full error
            }
            // await chuckRef.current.runCode(chuckInstructions);
        }
        isRunning.current = true;

    }

    // Debug: device options available
    // console.log("What are device options? ", deviceOptions);

    return (
        <>
            <Box
                id='chuckSetupContainer'
                sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'transparent',
                    zIndex: 10000,
                    pointerEvents: 'auto',
                }}>
                {initializing && (
                    <Button
                        id='chuckMicButtonWrapper'
                        sx={{
                            cursor: ready ? 'pointer' : 'not-allowed',
                            minWidth: '48px',
                            minHeight: '48px',
                            padding: '8px',
                            pointerEvents: 'auto',
                        }}
                        onClick={chuckMicButton}
                    >
                        <MicIcon sx={{ fontSize: '32px', color: "yellow", verticalAlign: 'middle' }} />
                    </Button>
                )}

                <Button
                    id='runChuckCodeButton'
                    sx={{
                        minWidth: '48px',
                        minHeight: '48px',
                        padding: '8px',
                        cursor: ready ? 'pointer' : 'not-allowed',
                        pointerEvents: 'auto',
                    }}
                    onClick={runChuckCode}
                >
                    {!isRunning.current ?
                        <PlayCircleIcon sx={{ fontSize: '32px', color: "green", verticalAlign: 'middle' }} /> :
                        <StopCircleIcon sx={{ fontSize: '32px', color: "red", verticalAlign: 'middle' }} />
                    }
                </Button>
            </Box>

            <OldParentMonolith
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

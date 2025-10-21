'use client';
import { use, useEffect, useRef, useState } from 'react';
import { loadWebChugins } from './WebChuckRaf';
import { useSignalBus } from '../store/useSignalBus';
import { useGuideMetricsStore } from '../store/useGuideMetricsStore';
import { Chuck } from 'webchuck';
import { getAsymptoticChopperClass, getGrainStretchClass, getLisaTriggerClass, getMosaicSynthClass, getRandomReverseClass, getReichClass, getTapeClass } from '../utils/audioInSettingsHelper';
import { useHudStore } from '../hooks/useHudStore';
import { useTimingStore } from '../hooks/useTimingStore';
import '../../app/globals.css';

import { useAudioInSettingsStore } from '../utils/audioInSettingsHelper';
import { min } from '@xenova/transformers';
import { audioInEffectSlidersHelper } from '../utils/utils';

const EFFECTS = [
    'Grain',
    'Tape',
    'Random Reverse',
    'Clapping',
    // TODO >>> fix these...
    // 'Lisa Trigger', 
    // 'Asymptotic Chopper',
    // 'Mosaic Synth'
];

type FxDropProps = {
    chuckRef:any, 
    updateSelectedAudioInSetting:any
};

function EffectDropdown(props: FxDropProps) {
    const { chuckRef, updateSelectedAudioInSetting } = props;
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [deviceOptions, setDeviceOptions] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [minimizeAudioInDropdown, setMinimizeAudioInDropdown] = useState(false);

// setAudioInSetting('grain_stretch', 12.0);

    return (
        <div style={{ width: '100%' }}>           
            <div
                style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    userSelect: 'none',
                }}
                // onClick={() => setOpen(o => !o)}
                 onClick={() => {
                    if (selected === '' && !minimizeAudioInDropdown) {
                        setMinimizeAudioInDropdown(true)
                    } else {
                        setMinimizeAudioInDropdown(false)
                    }
                    setSelected('')
                }}
            >
                {selected || 'Select Effect'}
                <span 
                    className="effects-dropdown-arrow"
                    style={{ 
                        rotate: selected ? '180deg' : '0deg', 
                    }}
                    >
                    ▼
                </span>
            </div>
            {/* {open && ( */}
            {!minimizeAudioInDropdown && (
                <div 
                    className='effects-dropdown-wrapper'
                >
                    {EFFECTS.map(effect => (
                        <div
                            key={effect}
                            className='effects-dropdown-item'
                            style={{
                                background: selected === effect ? 'rgba(255,255,255,0.10)' : 'transparent',
                            }}
                            onClick={() => {
                                setSelected(effect);
                                if (open) {
                                    setOpen(false);
                                    if (effect !== selected) {
                                        setSelected('');
                                    }
                                }
                                else {
                                    setOpen(true);
                                    setSelected(effect);
                                }
                            }}
                        >
                            {effect}
                            {selected && 
                            (selected === effect) && 
                            <EffectSliders 
                                effect={selected} 
                                chuckRef={chuckRef} 
                                updateSelectedAudioInSetting={updateSelectedAudioInSetting}
                            />}
                        </div>
                    ))}
                </div>
            )}
            {/* )} */}
            {/* {selected && <EffectSliders effect={selected} chuckRef={chuckRef} />} */}
        </div>
    );
}

function EffectSliders({ effect, chuckRef, updateSelectedAudioInSetting }: { effect: string, chuckRef: any, updateSelectedAudioInSetting: any }) {

    updateSelectedAudioInSetting(effect);
    

    const audioInSettingsHelperHash = useAudioInSettingsStore(s => s.audioInSettings);

    const sliderNames = audioInEffectSlidersHelper(effect);

    const transformedKeyNames: string[] = sliderNames.map(name => `${effect.trim().toLowerCase().replace(' ','_')}_${name.name.trim().toLowerCase().replace(' ','')}`) 
    
    const valsForEffect: any = []; 

    transformedKeyNames.map((n: any) => {
        valsForEffect.push((audioInSettingsHelperHash as any)[n]);
    }) 

    const [values, setValues] = useState(valsForEffect);
    const setAudioInSetting = useAudioInSettingsStore(s => s.setAudioInSetting);

    useEffect(() => {
        (async () => {
            sliderNames.map(async(name, i) => {
                setAudioInSetting(`${effect.trim().toLowerCase().replace(' ','_')}_${name.name.trim().toLowerCase().replace(' ','')}`, values[i]);
                chuckRef.current && await chuckRef.current.setAssociativeFloatArrayValue("audioInSettingsHelperHash", `${effect.trim().toLowerCase().replace(' ','_')}_${name.name.trim().toLowerCase().replace(' ','')}`, values[i]);
            })
        })();
        
    }, [values]);

    return (
        <div style={{ padding: '12px 8px 8px 8px', background: 'rgba(0,0,0,0.10)', borderRadius: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{effect} Controls</div>
            {sliderNames.map((name, i) => (
                <div key={name.name} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 13, color: '#e9f1ff', marginBottom: 2, display: 'block' }}>{name.name}</label>
                    <input
                        type="range"
                        min={name.min}
                        max={name.max}
                        value={name.type === "float" ? values[i] : name.type === "int" ? Math.floor(values[i]) : values[i]}
                        onChange={e => {
                            const v = Number(e.target.value);
                            setValues((vals: any) => vals.map((val: any, idx: any) => idx === i ? v : val));
                            
                        }}
                        style={{ zIndex: 99999, width: 180, accentColor: '#6cf', height: 4 }}
                    />
                    <span style={{ marginLeft: 10, fontSize: 12, color: '#b7d6ff' }}>{values[i]}</span>
                </div>
            ))}
        </div>
    );
}

export default function ChuckSetup() {

    const chuckRef = useRef<Chuck>(null);
    const [audioInSelected, setAudioInSelected] = useState<string>('lisaTrigger');
    const audioInSettingsHelperHash = useAudioInSettingsStore(s => s.audioInSettings);
    const [deviceOptions, setDeviceOptions] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

    const currentStreamRef = useRef<MediaStream | null>(null);
    const currentSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const updateSelectedAudioInSetting = (newSetting: string) => {
        setTimeout(() => {switch (newSetting.toLowerCase()) {
            case 'grain':
                setAudioInSelected('grain');
                break;
            case 'tape':
                setAudioInSelected('t');
                break;
            case 'random reverse':
                setAudioInSelected('rr');
                break;
            case 'clapping':
                setAudioInSelected('rei');
                break;
            case 'lisa trigger':
                setAudioInSelected('lisaTrigger');
                break;
            case 'asymptotic chopper':
                setAudioInSelected('achop');
                break;
            // case 'mosaic synth':
            //     setAudioInSelected('mosaic');
            //     break;
            default:
                setAudioInSelected('');
        }}, 20);

    }



    const chuckMicButton = async function ( selectedInput?: string ) {
     
        if (currentStreamRef.current) {
            currentStreamRef.current.getTracks().forEach(track => track.stop());
            currentStreamRef.current = null;
        }
        if (currentSourceRef.current) {
            currentSourceRef.current.disconnect();
            currentSourceRef.current = null;
        }

        if (deviceOptions?.length < 1) {
            await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            setDeviceOptions(devices.filter(device => device.kind === 'audioinput'));
            if (!selectedDeviceId && devices.length > 0) {
                setSelectedDeviceId(devices[0].deviceId);
                
            }
        }
        console.log('ChucK Mic Button Clicked');
        if (typeof window === 'undefined') return;

        navigator.mediaDevices
            .getUserMedia({
                video: false,
                audio: {
                    deviceId: { exact: selectedInput || selectedDeviceId || 'default' },
                    echoCancellation: true,
                    autoGainControl: false,
                    noiseSuppression: false,
                },
            })
            .then(async (stream: MediaStream) => {
                console.log('aCHUCK after mediastream: ', chuckRef.current);
                currentStreamRef.current = stream;
                const ctx: any = chuckRef.current && chuckRef.current.context;
                const adc = ctx.createMediaStreamSource(stream);
                currentSourceRef.current = adc;
                adc.connect(chuckRef.current);
                micButton.disabled = true;
            })
        const micButton: any = document.querySelector(`#micStartRecordButton`);
        micButton && (micButton.disabled = true);
    };

    const isCameraOn = useHudStore((s: any) => s.isCameraOn);

    const cameraOnButton = async function () {
        const setIsCameraOn = useHudStore.getState().setIsCameraOn;
         if (isCameraOn) {
            setIsCameraOn(false);
         } else {
            setIsCameraOn(true);
         }
    };

    const bus = useSignalBus.getState();
    const metrics = useGuideMetricsStore(state => state.metrics);
    console.log("@@@ Metrics from GuideMetricsStore in ChuckSetup: ", metrics);

    // const [beatMs, setBeatMs] = useState<number>(4000);

    const beatMs = useTimingStore((s:any) => s.beatMs);
    // const setBeatMs = useTimingStore((s:any) => s.setBeatMs);
        
    beatMs && chuckRef.current && chuckRef.current.setFloat('beatMs', beatMs);
    // const bpm = useTimingStore(s => s.bpm);
    const serverFilesToPreload = [{
        serverFilename: "static/model.txt",
        virtualFilename: "model.txt"
    }];

    useEffect(() => {
        import('webchuck').then((mod) => {        
            (async () => {

                const audioContext = new AudioContext();
                const sampleRate = audioContext.sampleRate;
                // calculateDisplayDigits(sampleRate);

                const LOCAL_CHUCK_SRC = "/webchuck/";
                
                const theChuck = await mod.Chuck.init(
                    serverFilesToPreload,
                    audioContext,
                    audioContext.destination.maxChannelCount,
                    // whereIsChuck
                    LOCAL_CHUCK_SRC
                );

                const chugins: string[] = loadWebChugins();
                chugins.forEach((chuginPath) => mod.Chuck.loadChugin(chuginPath));
                // const DEV_CHUCK_SRC = "https://chuck.stanford.edu/webchuck/dev/"; // dev webchuck src
                // const PROD_CHUCK_SRC = "https://chuck.stanford.edu/webchuck/src/"; // prod webchuck src
                // let whereIsChuck: string =
                //     localStorage.getItem("chuckVersion") === "dev"
                //         ? DEV_CHUCK_SRC
                //         : PROD_CHUCK_SRC;
                chuckRef.current = theChuck;
                
                await chuckRef.current.connect(audioContext.destination);
                
                // Expose a one-shot resume function for user gesture
                let resumed = false;
                (window as any).__resumeChuck = async () => {
                    if (resumed) return;
                    try {
                        await audioContext.resume();
                    } catch {}
                    try {
                        const ctx: any = chuckRef.current?.context;
                        if (ctx?.state === 'suspended') await ctx.resume();
                    } catch {}
                    resumed = true;
                    console.log('[WebChucK] Audio resumed');
                };
                let chuckVersion = '';

                chuckRef.current.getParamString("VERSION").then((value: string) => {
                    chuckVersion = value;
                    console.log("What is CHUCK VERSION?: ", chuckVersion)
                });

                chuckRef.current.chuckPrint = (message: string) => {
                    if (message.includes("TICK: ")) {
                        const parsedMsg = message.split(":")[1].trim();
                        // setChuckMsg(parsedMsg); 
                        console.log("TICK MESSAGE FROM CHUCK: ", parsedMsg);
                    } else {
                        if (message.includes("SHREDCOUNT: ")) {
                            console.log("SHREDCOUNT ", message)
                        }
                        // if (message.includes("updatedgain: ")) {
                            
                        //     console.log("updatedgain ", message)

                        //     const energy: number = useSignalBus.getState().rgb.energy;
                        //     const blue: number = useSignalBus.getState().rgb.b;
                        //     const red: number = useSignalBus.getState().rgb.r;
                        //     const green: number = useSignalBus.getState().rgb.g;

                        //     if (chuckRef.current) {
                        //         chuckRef.current.setFloat("energy", energy);
                        //         chuckRef.current.setFloat("red", red);
                        //         chuckRef.current.setFloat("green", green);
                        //         chuckRef.current.setFloat("blue", blue);
                        //     }
                        // }
                    }
                }

                console.log("THE CHUCK (current ref): ", chuckRef.current);


                const audioInClasses = `
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
                    ${getLisaTriggerClass(
                        beatMs,
                    )}
                    ${getAsymptoticChopperClass(
                        beatMs,
                    )}
                    // ${getMosaicSynthClass(beatMs)}
                `;

     


                const chuckInstructions = `

                    global float audioInSettingsHelperHash[0];
                    ${audioInSettingsHelperHash['grain_stretch']} => audioInSettingsHelperHash["grain_stretch"];
                    ${audioInSettingsHelperHash['grain_rate']} => audioInSettingsHelperHash["grain_rate"];
                    ${audioInSettingsHelperHash['grain_length']} => audioInSettingsHelperHash["grain_length"];
                    ${audioInSettingsHelperHash['grain_grains']} => audioInSettingsHelperHash["grain_grains"];
                    
                    ${audioInSettingsHelperHash['tape_delaylength']} => audioInSettingsHelperHash["tape_delaylength"];
                    ${audioInSettingsHelperHash['tape_loop']} => audioInSettingsHelperHash["tape_loop"];
                    ${audioInSettingsHelperHash['tape_gain']} => audioInSettingsHelperHash["tape_gain"];

                    ${audioInSettingsHelperHash['random_reverse_listen']} => audioInSettingsHelperHash["random_reverse_listen"];
                    ${audioInSettingsHelperHash['random_reverse_influence']} => audioInSettingsHelperHash["random_reverse_influence"];
                    ${audioInSettingsHelperHash['random_reverse_reversegain']} => audioInSettingsHelperHash["random_reverse_reversegain"];
                    ${audioInSettingsHelperHash['random_reverse_maxbufferlength']} => audioInSettingsHelperHash["random_reverse_maxbufferlength"];
                    ${audioInSettingsHelperHash['random_reverse_envelopeduration']} => audioInSettingsHelperHash["random_reverse_envelopeduration"];
                    ${audioInSettingsHelperHash['random_reverse_maxtimebetween']} => audioInSettingsHelperHash["random_reverse_maxtimebetween"];

                    ${audioInSettingsHelperHash["clapping_record"]} => audioInSettingsHelperHash["clapping_record"];
                    ${audioInSettingsHelperHash["clapping_play"]} => audioInSettingsHelperHash["clapping_play"];
                    ${audioInSettingsHelperHash["clapping_length"]} => audioInSettingsHelperHash["clapping_length"];
                    ${audioInSettingsHelperHash["clapping_voices"]} => audioInSettingsHelperHash["clapping_voices"];
                    ${audioInSettingsHelperHash["clapping_speed"]} => audioInSettingsHelperHash["clapping_speed"];
                    ${audioInSettingsHelperHash["clapping_bi"]} => audioInSettingsHelperHash["clapping_bi"];
                    ${audioInSettingsHelperHash["clapping_random"]} => audioInSettingsHelperHash["clapping_random"];
                    ${audioInSettingsHelperHash["clapping_spread"]} => audioInSettingsHelperHash["clapping_spread"];
                    ${audioInSettingsHelperHash["clapping_maxbuffermultiplier"]} => audioInSettingsHelperHash["clapping_maxbuffermultiplier"];

                    ${audioInSettingsHelperHash["lisa_trigger_listen"]} => audioInSettingsHelperHash["lisa_trigger_listen"];
                    ${audioInSettingsHelperHash["lisa_trigger_length"]} => audioInSettingsHelperHash["lisa_trigger_length"];
                    ${audioInSettingsHelperHash["lisa_trigger_minlength"]} => audioInSettingsHelperHash["lisa_trigger_minlength"];
                    ${audioInSettingsHelperHash["lisa_trigger_rampup"]} => audioInSettingsHelperHash["lisa_trigger_rampup"];
                    ${audioInSettingsHelperHash["lisa_trigger_rampdown"]} => audioInSettingsHelperHash["lisa_trigger_rampdown"];
                    ${audioInSettingsHelperHash["lisa_trigger_rate"]} => audioInSettingsHelperHash["lisa_trigger_rate"];
                    ${audioInSettingsHelperHash["lisa_trigger_bufferwindow"]} => audioInSettingsHelperHash["lisa_trigger_bufferwindow"];
                    ${audioInSettingsHelperHash["lisa_trigger_envwindow"]} => audioInSettingsHelperHash["lisa_trigger_envwindow"];

                    ${audioInSettingsHelperHash["asymptotic_chopper_listen"]} => audioInSettingsHelperHash["asymptotic_chopper_listen"];
                    ${audioInSettingsHelperHash["asymptotic_chopper_length"]} => audioInSettingsHelperHash["asymptotic_chopper_length"];
                    ${audioInSettingsHelperHash["asymptotic_chopper_minlengthdivisor"]} => audioInSettingsHelperHash["asymptotic_chopper_minlengthdivisor"];
                    ${audioInSettingsHelperHash["asymptotic_chopper_maxlengthmultiplier"]} => audioInSettingsHelperHash["asymptotic_chopper_maxlengthmultiplier"];
                    ${audioInSettingsHelperHash["asymptotic_chopper_envwindow"]} => audioInSettingsHelperHash["asymptotic_chopper_envwindow"];
                  
                    ${beatMs}::ms => dur whole;
                 
                    ${beatMs} => global int BeatMsInts;

                    0.0 => global float energy;
                    0.0 => global float red;
                    0.0 => global float green;
                    0.0 => global float blue;
                    float _m;

                    class TheEvent extends Event
                    {
                        int pitch;
                        float velocity;
                    }
                    
                    global float theUpdatedGain;

                    global float audioInAssociativeArr;
                    
                    ${audioInClasses}
                    
                    LisaTrigger lisaTrigger; 
                    GrainStretch grain;
                    Tape t;
                    RandomReverse rr; 
                    Reich rei;
                    AsymptoticChopper achop;
                    NRev rev_audioin;


                    class AudioIn_SpecialEffectsChain extends Chugraph
                    {
                        inlet => ${audioInSelected} => LPF lpf_audioin => outlet;
                        
                        0.6 => rev_audioin.mix;

                        "${audioInSelected}" => string currEffect;

                        if (currEffect == "t") {
                            t.loop(1);
                        }

                        if (currEffect == "grain") {
                            grain.stretch(Std.ftoi(audioInSettingsHelperHash["grain_stretch"]));
                            grain.rate(audioInSettingsHelperHash["grain_rate"]);
                            grain.length((BeatMsInts/2)::ms);
                            grain.maxLength((BeatMsInts)::ms);
                            grain.grains(Std.ftoi(audioInSettingsHelperHash["grain_grains"]));
                        }
           
                        if (currEffect == "rr") {
                            rr.setInfluence(1.0);
                            rr.listen(1);
                        }

                        if (currEffect == "rei") {
                            rei.record(1);
                            rei.play(1);
                        }
                    

                        if (currEffect == "lisaTrigger") {
                            lisaTrigger.listen(1);
                            lisaTrigger.length((BeatMsInts)::ms);
                            lisaTrigger.minimumLength(((BeatMsInts)/4)::ms);
                        }
                        // if (currEffect == "achop") {
                            achop.listen(1);
                            achop.length((BeatMsInts)::ms);
                            achop.minimumLength(((BeatMsInts)/4)::ms);
                        // }   
                    }

                    AudioIn_SpecialEffectsChain audioin_SpecialFxChain;
                                
                    // adc => audioin_SpecialFxChain => Dyno audInDyno => dac;
    
                    fun void flipGain() { 
                        while (true) { 
                            0.6 => theUpdatedGain; 
                            1::second => now; 
                            0.0 => theUpdatedGain; 
                            1::second => now; 
                        } 
                    }
                    
                    TheEvent e;

                    NRev reverb => dac;
                    .17 => reverb.mix;

                    spork ~ flipGain();

                    fun void hi( TheEvent e, int id )
                    {
                        FrencHrn f => reverb;
        
                        while( true )
                        {
                            e => now;
                            <<< "shred", id, ":", e.pitch, e.velocity >>>;
                
                            e.pitch => Std.mtof => f.freq;
                            theUpdatedGain => f.gain;
                            e.velocity => f.noteOn;

                            float _m;

                            energy => reverb.mix;
                            <<< "updatedgain: ", reverb.mix() >>>;
                            300::ms => now;
                            
                            f.noteOff( 0 );
                        }
                    }

                    spork ~ hi( e, 1 );

                    me.yield();


                    while( true )
                    {
                        adc => audioin_SpecialFxChain => Dyno audInDyno => dac;
                        Math.random2( 48, 60 ) => e.pitch;
                        Math.random2f( .5,.65 ) => e.velocity;
                        t.delayLength(audioInSettingsHelperHash["tape_delaylength"]::ms);
                        t.gain(audioInSettingsHelperHash["tape_gain"]);
                        e.signal();
                        <<< "SHREDCOUNT: ", Machine.numShreds() >>>;
                        4000::ms => now;
                    }


                `;

                console.log("CHUCK DEBUG: ", chuckInstructions);

                chuckRef.current && await chuckRef.current.runCode(`Machine.removeAllShreds();`);
                chuckRef.current && await chuckRef.current.runCode(`Machine.resetShredID();`);
                chuckRef.current.runCode(chuckInstructions)
                    .then(() => {
                        Object.entries(audioInSettingsHelperHash).map((k, v) => {
                            chuckRef.current && chuckRef.current.setAssociativeFloatArrayValue("audioInSettingsHelperHash", `${k}`, v);
                        });
                    })
            })();
        });
    }, [selectedDeviceId]);


    const updateAudioInputDevice = async (e: any) => {
        setSelectedDeviceId(e.target.value);
        const devices = await navigator.mediaDevices.enumerateDevices();
            
        // setDeviceOptions(devices.filter(device => device.kind === 'audioinput'));
        // if (!selectedDeviceId && devices.length > 0) {
        //     setSelectedDeviceId(devices[0].deviceId);
        chuckMicButton(e.target.value);
        // }
    }

    return (
        <>
            <div style={{ position: 'absolute', top: '80px', padding: '0px', margin: '0px', left: '10px' }}>
                {/* <label style={{ color: '#e9f1ff', fontSize: 13 }}>Audio Input Device:</label> */}
                <select
                    value={selectedDeviceId}
                    onChange={e => updateAudioInputDevice(e)}
                    style={{
                        marginLeft: 8, 
                        padding: 4, 
                        borderRadius: 4,
                        cursor: 'pointer',
                        zIndex: 9998 
                    }}
                >
                     <option value="" style={{ color: '#e9f1ff', fontSize: 13 }}>Audio Input Device:</option>
                    {deviceOptions.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Device ${device.deviceId}`}
                        </option>
                    ))}
                </select>
            </div>
            <button 
                disabled={false}
                style={{
                    position: 'absolute',
                    top: '120px',
                    left: '20px',
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.25)',
                    color: '#e9f1ff',
                    cursor: 'pointer'
                }}
                id="micStartRecordButton" 
                onClick={() => chuckMicButton()}
            >
                Enable Microphone (use headphones for default device)
            </button>
            {/* Dropdown for selecting effects */}
            <div
                style={{
                    position: 'absolute',
                    top: '150px',
                    left: '20px',
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.25)',
                    color: '#e9f1ff',
                    borderRadius: 4,
                    width: 220,
                    zIndex: 10
                }}
            >
                <EffectDropdown 
                    chuckRef={chuckRef} 
                    updateSelectedAudioInSetting={(e:any) => updateSelectedAudioInSetting(e)} 
                />
            </div>
        </>
    );
}

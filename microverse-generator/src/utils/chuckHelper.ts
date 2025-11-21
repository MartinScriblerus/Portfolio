import { useEffect } from "react";
import { HID } from "webchuck";
// import { audioInHelperString } from "../utils/audioInSettingsHelper";
// import { Sources } from "../../interfaces/audioTypes";
import { universalSources } from "../../app/state/refs";
import { EffectsSettings, Sources } from "../interfaces/audioTypes";




export function buildSourceData(sourceName: keyof typeof universalSources.current) {
  const src: any = universalSources.current?.[sourceName];
  if (!src?.effects) {
    return {
      signalChain: [],
      signalChainDeclarations: [],
      valuesReadout: {},
      valuesReadoutDeclarations: {}
    };
  }

  const active = Object.values(src.effects).filter((fx: any) => fx.On);

  const signalChain: any = [];
  const signalChainDeclarations: any = [];
  const valuesReadout: Record<string, any> = {};
  const valuesReadoutDeclarations: Record<string, any> = {};

  active.forEach((fx: any) => {
    // e.g. "bitcrusher_sampler"
    const varName = `${fx.VarName}_${String(sourceName)}`;

    // chain wiring
    signalChain.push(fx.Type.toLowerCase());               // "bitcrusher"
    signalChain.push(`${varName} => `);                    // "bitcrusher_sampler =>"

    // declaration
    signalChainDeclarations.push(`${fx.Type.toLowerCase()} => dac;`);
    signalChainDeclarations.push(`${fx.Type} ${varName};`);

    console.log("SIGNAL CHAIN DECLARATIONS ARE: ", signalChainDeclarations);  

    // presets into valuesReadout + valuesReadoutDeclarations
    valuesReadout[fx.Type.toLowerCase()] = {};
    valuesReadoutDeclarations[fx.Type.toLowerCase()] = {};

    Object.entries(fx.presets).forEach(([param, preset]: [string, any]) => {
      const assignLine = `allFXDynamic${preset.kind}[\"${varName}_${param}\"] => ${varName}.${param};`;
      valuesReadout[fx.Type.toLowerCase()][param] = assignLine;

      const getterLine = `(${preset.value}) => allFXDynamic${preset.kind}[\"${varName}_${param}\"];`;
      valuesReadoutDeclarations[fx.Type.toLowerCase()][param] = getterLine;
    });
  });

  return {
    signalChain,
    signalChainDeclarations,
    valuesReadout,
    valuesReadoutDeclarations
  };
}

export function getAllSignalData() {
  if (!universalSources.current) return {};

  const makeData = (src: any) => {
    if (!src?.effects) {
      return {
        signalChain: [],
        signalChainDeclarations: [],
        valuesReadout: {},
        valuesReadoutDeclarations: {}
      };
    }

    const active = Object.values(src.effects).filter((fx: any) => fx.On);

    return {
      signalChain: active.map((fx: any) => fx.VarName),
      signalChainDeclarations: active.map((fx: any) => `${fx.VarName} => dac;`), // example
      valuesReadout: Object.fromEntries(
        active.map((fx: any) => [fx.VarName, fx.presets])
      ),
      valuesReadoutDeclarations: Object.fromEntries(
        active.map((fx: any) => [fx.VarName, Object.keys(fx.presets)])
      )
    };
  };

  return {
    osc1: makeData(universalSources.current.osc1),
    stk: makeData(universalSources.current.stk1),
    sampler: makeData(universalSources.current.sampler),
    audioin: makeData(universalSources.current.audioin)
  };
}














export async function applyPresetValue(
    chuckRef: React.MutableRefObject<any>,
    fx: any,
    preset: any,
    varName: string,
    readoutMap: Record<string, string>,
    readoutDeclMap: Record<string, string>
) {

    if (!preset || typeof preset.type !== "string" || typeof preset.name !== "string") return;

    const t = preset.type;
    const isDur = t.includes("dur");

    console.log("blammmm ", preset);

    if (t.includes("int")) {
        const placeHolder = `allFXDynamicInts["${varName}_${preset.name}"]`;
        const latestValue = `${placeHolder} => ${varName}.${preset.name};`;
        if (!fx.Code) {
            readoutMap[preset.name] = latestValue;
            readoutDeclMap[preset.name] =
                `(${preset.value})${preset.type.includes("dur") ? "::ms" : ""} => ${placeHolder};`;
        }
        await chuckRef.current?.setAssociativeIntArrayValue(
            "allFXDynamicInts", `${varName}_${preset.name}`, preset.value
        );
    } else if (preset.type.includes("float")) {
        const placeHolder = `allFXDynamicFloats["${varName}_${preset.name}"]`;
        const latestValue = `${placeHolder} => ${varName}.${preset.name};`;
        if (!fx.Code) {
            readoutMap[preset.name] = latestValue;
            readoutDeclMap[preset.name] =
                `(${preset.value})${preset.type.includes("dur") ? "::ms" : ""} => ${placeHolder};`;
        }
        await chuckRef.current?.setAssociativeFloatArrayValue(
            "allFXDynamicFloats", `${varName}_${preset.name}`, preset.value
        );
    }
    console.log("@@ Applying preset:", preset, "to variable:", varName, "with type:", t, "readoutMap:", readoutMap, "readoutDeclMap:", readoutDeclMap);
}

// export const createEmptyTargets: any = () => ({
//     signalChain: [],
//     signalChainDeclarations: [],
//     valuesReadout: {},
//     valuesReadoutDeclarations: {}
// });

export type SignalChainTargets = {
  signalChain: string[];
  signalChainDeclarations: string[];
  valuesReadout: string[];
  valuesReadoutDeclarations: string[];
};

export function createEmptyTargets(): SignalChainTargets {
  return {
    signalChain: [],
    signalChainDeclarations: [],
    valuesReadout: [],
    valuesReadoutDeclarations: []
  };
}








export async function processSourceFX(
  sourceKey: keyof Sources,
  fxList: any[],
  chuckRef: any,
  fxRadioValue: string,
  targets: SignalChainTargets,
  universalSources: Sources | undefined
) {
  for (const fx of fxList) {
    // console.log("SANITY FXFX: ", fx);
    const type = fx.Type;
    // const varName = `${fx.VarName}_${fxRadioValue}`;
    const varName = `${fx.VarName}_${String(sourceKey)}`;
    const isArrayEffect = ['Delay', 'DelayL', 'DelayA'].includes(type);

    const ANALYZERS = new Set([
        "PitchTrack", "Centroid", "FFT", "RMS", "ZeroX" // extend as needed
    ]);

    console.log("THE IS TARGETS? ", targets);

    // --- NEW: analyzer guard
    if (ANALYZERS.has(type)) {
      const decl = `${type} ${varName}; ${varName} => blackhole; `;
      if (!targets.signalChainDeclarations.includes(decl)) {
        targets.signalChainDeclarations.push(decl);
      }
      // analyzers don't get presets applied the same way; skip applyPresetValue
      continue;
    }

    // const lines = isArrayEffect ? (fx.presets?.lines?.value ?? 1) : undefined;


    let addedEffect: any = isArrayEffect
      ? `${type} ${varName}[${fx.presets.lines.value || 1}] => `
      : `${varName} => `;

    const addedEffectDeclaration = isArrayEffect
      ? `${type} ${varName}[${fx.presets.lines.value || 1}]; `
      : `${type} ${varName}; `;


    console.log("fxRadioValue: ", fxRadioValue, "fx.VarName: ", fx.VarName, "varName: ", varName);

    console.log("** ADDED EFFECT: ", addedEffect);
    console.log("** ADDED EFFECT DECLARATION: ", addedEffectDeclaration);
    console.log("** targets prior: ", targets);
    console.log("** FX ???? ", fx);

    // if(addedEffect.split(" ").length > 1 && addedEffect.split(" ")[0].includes('Delay')) {
    //     addedEffect = addedEffect?.split(" ").shift()?.toString();
    // }
    if (
        !Object.values(targets.signalChain).toString().includes(addedEffect) && 
        universalSources && universalSources[sourceKey] && Object.values(universalSources[sourceKey].effects).filter(i => i.On && i.VarName === fx.VarName).length > 0 &&
        targets.signalChain.indexOf(addedEffect) === -1
    ) {
      targets.signalChain.push(addedEffect);
    }

    if (
        !Object.values(targets.signalChainDeclarations).toString().includes(addedEffectDeclaration) &&
        universalSources && universalSources[sourceKey] && Object.values(universalSources[sourceKey].effects).filter(i => i.On && i.VarName === fx.VarName).length > 0 &&
        targets.signalChainDeclarations.indexOf(addedEffectDeclaration) === -1
    ) {
      targets.signalChainDeclarations.push(addedEffectDeclaration);
    }

    for (const preset of Object.values(fx.presets)) {

        if (universalSources && universalSources[sourceKey] && Object.values(universalSources[sourceKey].effects).filter(i => i.On && i.VarName === fx.VarName).length === 0) {
            console.log("SKIPPING PRESET APPLICATION FOR ", fx.VarName, " AS IT IS TURNED OFF");
            continue;
        }

      try {
        await applyPresetValue(
          chuckRef,
          fx,
          preset,
          varName,
        //   targetsRef.current.osc1.valuesReadout as any,
          targets.valuesReadout as any,
          targets.valuesReadoutDeclarations as any
        );
      } catch (err) {
        console.error(`applyPresetValue failed for ${varName}:`, err);
      }
    }
    console.log("OY TARGETS SANITY??? ", targets);
  }
}



export const getChuckCode = (
    isTestingChord: number | undefined,
    filesArray: string,
    currentNoteVals: any,
    masterPatternsRef: any,
    masterFastestRate: number,
    numeratorSignature: number,
    denominatorSignature: number,
    bpm: number,
    moogGrandmotherEffects: any,
    signalChain: string[],
    signalChainDeclarations: any,
    signalChainSampler: string[],
    signalChainSamplerDeclarations: any,
    signalChainSTK: string[],
    signalChainSTKDeclarations: any,
    signalChainAudioIn: string[],
    signalChainAudioInDeclarations: any,
    valuesReadout: any,
    valuesReadoutSampler: any,
    valuesReadoutSTK: any,
    valuesReadoutAudioIn: any,
    valuesReadoutDeclarations: any,
    valuesReadoutSamplerDeclarations: any,
    valuesReadoutSTKDeclarations: any,
    valuesReadoutAudioInDeclarations: any,
    getSourceFX: any,
    mTFreqs: number[],
    activeSTKDeclarations: any,
    activeSTKSettings: any,
    activeSTKPlayOn: any,
    activeSTKPlayOff: any,
    selectedChordScaleOctaveRange: any, // key: 'C', scale: 'Diatonic', chord: 'M', octaveMax: '4', octaveMin: '1'
    maxMinFreq: any,
    notesHolder: any,
    hid: HID | null,
) => {

    // console.log("HID? ", hid);
    console.log("JUST PRIOR TO CHUCK HERE IS selectedChordScaleOctaveRange: ", selectedChordScaleOctaveRange);
    console.log("MASTER FASTEST RATE: ", masterFastestRate);
    console.log("HEY_YO FILES ARRAY! ", filesArray);    
    console.log("SANITY NOTESHOLDER: ", notesHolder.current);
    console.log("VALS DECLARATIONS: ", valuesReadoutDeclarations);
    console.log("MASTERPATTERNSREF IN CHUCK HELPER: ", Object.values(masterPatternsRef.current));

    const beatInMilliseconds = ((60000 / bpm));

    console.log("BEAT LENGTH IN MILLISECONDS >>> ", beatInMilliseconds);

    type NoteEvent = {
        freq: number;
        startTime: number; // in beats or seconds
        duration: number; // in beats or seconds
        velocity: number;
    };
      


    const masterPatternsObj = (Object.values(masterPatternsRef.current).map((i:any)=>Object.values(i))[0])[0];
    // const masterPatternsStr = JSON.stringify(masterPatternsObj);
    console.log("MASTER PATTERNS OBJ ", masterPatternsObj);


    console.log("LALALA ", Object.values(valuesReadout).map((value: any) => value).join(' '));

    const newChuckCode = `
    
    // "" => global string currentSrc;
    // SAFER DYNAMIC FILES
    [${filesArray[0]}] @=> string files[];

    
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
    global int stkInstsInUse;
    global float allFXDynamicFloats[0];
    global float allSTKFXDynamicFloats[0];
    // global float beatMS;
    // global int numeratorSignature;
    // global int denominatorSignature;

    // 0.5 => global float osc1MasterGain;
    // 0.5 => global float samplerMasterGain;
    // 0.5 => global float audioInMasterGain;
    // 0.5 => global float stkMasterGain;

    global float audioMixer_Osc1[0];
    global float audioMixer_Stk1[0]; 
    global float audioMixer_Sampler[0]; 
    global float audioMixer_AudioIn[0];  

    ${beatInMilliseconds} => global float beatMS; 




    ${signalChainDeclarations.map((value: any) => value).join(' ')}
    ${signalChainSamplerDeclarations.map((value: any) => value).join(' ')}
    ${signalChainSTKDeclarations.map((value: any) => value).join(' ')}
    ${signalChainAudioInDeclarations.map((value: any) => value).join(' ')}

    ${Object.values(valuesReadoutDeclarations).map((value: any) => value).join(' ')}
    ${Object.values(valuesReadoutSamplerDeclarations).map((value: any) => value).join(' ')}
    ${Object.values(valuesReadoutSTKDeclarations).map((value: any) => value).join(' ')}
    ${Object.values(valuesReadoutAudioInDeclarations).map((value: any) => value).join(' ')}


    ${hid} => Hid hi;                

    HidMsg msg;             


    ${numeratorSignature} => global int numeratorSignature;
    ${denominatorSignature} => global int denominatorSignature;

    // Initial settings
    ${bpm} => bpmInit;

    1 => global int arpeggiatorOn;

    ${beatInMilliseconds / numeratorSignature} => float beatInt;

    beatInt / 1000 => float beatSeconds;
    beatSeconds :: second => dur quarterNote;

    <<< "TICK TIMER: ", beatSeconds * 1000 >>>;

    ${numeratorSignature.toFixed(2)} / denominatorSignature => float beatFactor;
    // quarterNote * beatFactor => dur adjustedBeat;
    quarterNote * beatFactor => dur adjustedBeat;
    adjustedBeat => dur beat;

    <<< "TICK TIMER ADJUSTED: ", beat >>>;

    // beat * numeratorSignature => dur whole;
    // whole * denominatorSignature => dur measure;
    beat * numeratorSignature => dur whole;
    <<< "TICK TIMER WHOLE: ", whole >>>;
    whole => dur measure;

    // Number of voices for polyphony
    1 => global int numVoices;
    global float NOTES_SET[0];
    ${currentNoteVals.osc1[0]} => global int fastestRateUpdate;

    SawOsc saw1;
    SawOsc saw2;
    LPF lpf;
    ADSR adsr;
    Dyno limiter;
    NRev rev;
    Noise noiseSource;
    Gain pitchLfo;
    Gain filterLfo;
    TriOsc tri1, tri2;
    SqrOsc sqr1, sqr2;
    SinOsc SinLfo;
    SawOsc SawLfo;
    SqrOsc SqrLfo;

    0 => global int tickCounter;
    0 => global int fastestTickCounter;

    class Osc1_EffectsChain extends Chugraph
    { 
        inlet => ${signalChain.join(' ')} outlet;

        ${Object.values(valuesReadout).map((value: any) => value).join(' ')}
        ${getSourceFX('osc1')}
    }

    class Sampler_EffectsChain extends Chugraph
    {
        inlet => ${signalChainSampler.join(' ')} outlet;
        ${Object.values(valuesReadoutSampler).map((value: any) => value).join(' ')}
        ${getSourceFX('sampler')}
    }

    class STK_EffectsChain extends Chugraph {
        inlet => ${signalChainSTK.join(' ')} outlet;
        ${Object.values(valuesReadoutSTK).map((value: any) => value).join(' ')}
        ${getSourceFX('stk')}
    }

    class AudioIn_EffectsChain extends Chugraph {
        inlet => ${signalChainAudioIn.join(' ')} outlet;
        ${Object.values(valuesReadoutAudioIn).map((value: any) => value).join(' ')}
        ${getSourceFX('audioin')}
    }

    SndBuf buffers[5] => Sampler_EffectsChain sampler_FxChain => Dyno sampler_MasterDyno => Pan2 sampler_MasterPan => Gain sampler_MasterGain => dac;


0 => int filterEnvRunning;



    fun void SilenceAllBuffers()
    {
        buffers[0].samples() => buffers[0].pos;
        buffers[1].samples() => buffers[1].pos;
        buffers[2].samples() => buffers[2].pos;
        buffers[3].samples() => buffers[3].pos;
        buffers[4].samples() => buffers[4].pos;
    }



    6.0 => float lfoFreqDefault;

    // BEGIN SYNTH VOICE DEFAULTS
    class SynthVoice extends Chugraph
    {
        saw1 => lpf => adsr => limiter => outlet;
        
        saw2 => lpf;
        noiseSource => lpf;

        moogGMDefaults["noise"] => noiseSource.gain;

        SinLfo => pitchLfo => blackhole;
        SinLfo => filterLfo => blackhole;

        fun void SetLfoFreq(float frequency) 
        {
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

        
        // rethink volume when creating a master panel....
        0.99 => saw1.gain => saw2.gain;
        0.99 => tri1.gain => tri2.gain;
        0.99 => sqr1.gain => sqr2.gain;

        80.0 => float filterCutoff;
        filterCutoff => lpf.freq;

        ${moogGrandmotherEffects.current.offset.value} => float offset;
        1.0 => float filterEnv;
        1.0 => float osc2Detune;
        ${moogGrandmotherEffects.current.oscOffset.value} => float oscOffset;

        fun void SetOsc1Freq(float frequency)
        {
            frequency => tri1.freq => sqr1.freq => saw1.freq; 
        }

        fun void SetOsc2Freq(float frequency)
        {
            frequency => tri2.freq => sqr2.freq => saw2.freq; 
        }

        
        fun void keyOn(float noteNumber)
        {
            <<< "CALLED_KEYON: ", noteNumber >>>;
    
            Std.mtof(offset + Std.ftom(noteNumber)) => SetOsc1Freq;
            Std.mtof(offset + Std.ftom(noteNumber) + oscOffset) - osc2Detune => SetOsc2Freq;
            
            // 1 => adsr.keyOn;  
            if (filterEnvRunning == 0)
            {           
                spork ~ filterEnvelope();
            }
            // me.yield();
        }

        fun void ChooseOsc1(int oscType)
        {
            if(oscType == 0)
            {
                tri1 =< lpf;
                saw1 =< lpf;
                sqr1 =< lpf;
            }
            if(oscType == 1)
            {
                tri1 => lpf;
                saw1 =< lpf;
                sqr1 =< lpf;
            }
            if(oscType == 2)
            {
                tri1 =< lpf;
                saw1 => lpf;
                sqr1 =< lpf;
            }
            if(oscType == 3)
            {
                tri1 =< lpf;
                saw1 =< lpf;
                sqr1 => lpf;
            }
        }
        fun void ChooseOsc2(int oscType)
        {
            if(oscType == 0)
            {
                tri2 =< lpf;
                saw2 =< lpf;
                sqr2 =< lpf;
            }
            if(oscType == 1)
            {
                tri2 => lpf;
                saw2 =< lpf;
                sqr2 =< lpf;
            }
            if(oscType == 2)
            {
                tri2 =< lpf;
                saw2 => lpf;
                sqr2 =< lpf;
            }
            if(oscType == 3)
            {
                tri2 =< lpf;
                saw2 =< lpf;
                sqr2 => lpf;
            }
            if(oscType == 4)
            {
                tri2 =< lpf;
                saw2 =< lpf;
                sqr2 =< lpf;
            }
        }
        fun void ChooseLfo(int oscType)
        {
            if(oscType == 0)
            {
                SinLfo =< filterLfo;
                SinLfo =< pitchLfo;
                SawLfo =< filterLfo;
                SawLfo =< pitchLfo;
                SqrLfo =< filterLfo;
                SqrLfo =< pitchLfo;
            }
            if(oscType == 1)
            {
                SinLfo => filterLfo;
                SinLfo => pitchLfo;
                SawLfo =< filterLfo;
                SawLfo =< pitchLfo;
                SqrLfo =< filterLfo;
                SqrLfo =< pitchLfo;
            }
            if(oscType == 2)
            {
                SinLfo =< filterLfo;
                SinLfo =< pitchLfo;
                SawLfo => filterLfo;
                SawLfo => pitchLfo;
                SqrLfo =< filterLfo;
                SqrLfo =< pitchLfo;
            }
            if(oscType == 3)
            {
                SinLfo =< filterLfo;
                SinLfo =< pitchLfo;
                SawLfo =< filterLfo;
                SawLfo =< pitchLfo;
                SqrLfo => filterLfo;
                SqrLfo => pitchLfo;
            }
        }


        fun void monitorEnvelope() {
            while (adsr.state() != 0 || adsr.value() > 0.001) {
                whole => now;
            }
            // Cleanup or disable this voice if needed
            // Could add back to a voice pool here
        }
        fun void keyOff(int noteNumber) {
            <<< "CALLED KEYOFF WITH ", noteNumber >>>;
             
            noteNumber => adsr.keyOff;
            spork ~ monitorEnvelope();
        }

        fun void filterEnvelope()
        {
            1 => filterEnvRunning;
            filterCutoff => float startFreq;
            while((adsr.state() != 0 && adsr.value() == 0) == false)
            {
                Std.fabs((filterEnv * adsr.value()) + startFreq + filterLfo.last()) => lpf.freq;  
                

                (adsr.attackTime() + adsr.decayTime()) => dur hold;
                // PROBLEMATIC!!!_1
                hold => now;
                                    
                adsr.keyOff();
                adsr.releaseTime() => now;
            }
            0 => filterEnvRunning;
        }

        // fun void cutoff(float amount)
        // {
        //     if(amount > 100)
        //     {
        //         100 => amount;
        //     }
        //     if(amount < 0)
        //     {
        //         0 => amount;
        //     }
        //     (amount / 100) * 5000 => filterCutoff;
        //     ////////////////////////////////////////////////////////

        //         (beatMS)::ms => now;

        //     ////////////////////////////////////////////////////////
        // }

        fun void cutoff(float amount)
        {
            if(amount > 100)
            {
                100 => amount;
            }
            if(amount < 0)
            {
                0 => amount;
            }
            (amount / 100) * 5000 => filterCutoff;

            // DO NOT sleep here. Avoid blocking calls inside parameter setters.
            // If you must synchronize to the beat, handle scheduling from the caller side.
        }

        fun void rez(float amount)
        {

            if(amount > 100)
            {
                100 => amount;
            }
            if(amount < 0)
            {
                0 => amount;
            }
            20 * (amount / 100) + 0.3 => lpf.Q;
        }

        fun void env(float amount)
        {
            if(amount > 100)
            {
                100 => amount;
            }
            if(amount < 0)
            {
                0 => amount;
            }
            5000 * (amount / 100) => filterEnv;
        }

        fun void detune(float amount)
        {
            if(amount > 100)
            {
                100 => amount;
            }
            if(amount < 0)
            {
                0 => amount;
            }
            5 * (amount / 100) => osc2Detune;
        }

        fun void pitchMod(float amount)
        {
            if(amount > 100)
            {
                100 => amount;
            }
            if(amount < 1)
            {
                0 => amount;
            }
            84 * (amount / 100) => pitchLfo.gain;
        }   

        fun void cutoffMod(float amount)
        {
            if(amount > 100)
            {
                100 => amount;
            }
            if(amount < 1)
            {
                0 => amount;
            }
            500 * (amount / 100) => filterLfo.gain;
        }
            
        fun void noise(float amount)
        {
            if(amount > 100)
            {
                100 => amount;
            }
            if(amount < 1)
            {
                0 => amount;
            }
            ( 1.0 * (amount / 100) ) => noiseSource.gain;
        }            
    }
    SynthVoice voice[numVoices];

      

    voice[numVoices - 1] => Osc1_EffectsChain osc1_FxChain => Dyno osc1_MasterDyno => Pan2 osc1_MasterPan => Gain osc1_MasterGain => dac;



  
    



    fun void handlerFXUpdate(Event fxUpdatez) {
        fxUpdatez => now;

        string keys[0];
        allFXDynamicInts.getKeys(keys);

        ${Object.values(valuesReadout).map((value: any) => value).join(' ')}
        ${Object.values(valuesReadoutSampler).map((value: any) => value).join(' ')}
        ${Object.values(valuesReadoutSTK).map((value: any) => value).join(' ')}
        ${Object.values(valuesReadoutAudioIn).map((value: any) => value).join(' ')}

    }

    fun void updateAudioMixerLevels() {
        audioMixer_Osc1["gain"] => float osc1Gain;
        audioMixer_Sampler["gain"] => float samplerGain;
        audioMixer_AudioIn["gain"] => float audioinGain;
        audioMixer_Stk1["gain"] => float stk1Gain;
        osc1Gain >= 0.0 ? audioMixer_Osc1["gain"] : 0.5 => osc1_MasterGain.gain;
        samplerGain >= 0.0 ? audioMixer_Sampler["gain"] : 0.5 => sampler_MasterGain.gain;
        // audioinGain >= 0.0 ? audioMixer_AudioIn["gain"] : 0.5 => audioin_MasterGain.gain;
        stk1Gain >= 0.0 ? audioMixer_Stk1["gain"] : 0.5 => stk1_MasterGain.gain;

        audioMixer_Osc1["pan"] => float osc1Pan;
        audioMixer_Sampler["pan"] => float samplerPan;
        audioMixer_AudioIn["pan"] => float audioinPan;
        audioMixer_Stk1["pan"] => float stk1Pan;
        (osc1Pan >= -1.0 && osc1Pan <= 1.0) ? audioMixer_Osc1["pan"] : 0.0 => osc1_MasterPan.pan;
        (samplerPan >= -1.0 && samplerPan <= 1.0) ? audioMixer_Sampler["pan"] : 0.0 => sampler_MasterPan.pan;
        // (audioinPan >= -1.0 && audioinPan <= 1.0) ? audioMixer_AudioIn["pan"] : 0.0 => audioin_MasterPan.pan;
        (stk1Pan >= -1.0 && stk1Pan <= 1.0) ? audioMixer_Stk1["pan"] : 0.0 => stk1_MasterPan.pan;
    }

    fun void playProgrammaticNote(float noteLength, float noteFreqs, float noteVels) {
        
        // WORK OUT BETTER WAY THAN NUMVOICES 
        
        // for (0 => int i; i < numVoices; i++) {
            
            if (noteFreqs != 9999.0 && noteFreqs > 0.0) {
                1 => adsr.keyOn; 
                noteFreqs => voice[0].keyOn;
                // noteVels => voice[0].gain;

                <<< "PROGLEN: ", (beatMS * noteLength) >>>;
                (beatMS * noteLength)::ms => dur noteDur;
                noteDur => now;
                1 => voice[0].keyOff;
            } else {
                (beatMS * noteLength)::ms => dur noteDur;
                noteDur => now;
            }

        // }
    }

    voice[numVoices - 1] => STK_EffectsChain stk_FxChain => Dyno stk1_MasterDyno => Pan2 stk1_MasterPan => Gain stk1_MasterGain => dac;
    ${activeSTKDeclarations}

    fun void handlerPlaySTK1(
        int tickCount, float noteLength
        // Event playASTK
    ) {
        // while (true) {
            // playASTK => now;
            midiNotesArray[tickCount] => float midiNotesToPlay;
            midiFreqsArray[tickCount] => float midiFreqsToPlay;
            midiLengthsArray[tickCount] => float midiLengthsToPlay;
            midiVelocitiesArray[tickCount] => float midiVelocitiesToPlay;
            
            [midiFreqsToPlay] @=> float allFreqs[];
            for (0 => int stk_f; stk_f < allFreqs.size() && stk_f < numVoices; stk_f++) {
                ${activeSTKSettings}
                ${activeSTKPlayOn}
                beat => now;
                ${activeSTKPlayOff}
            }
        //     me.yield();
        // }
    }
    

    // // SAMPLER
    fun void handlePlayDrumMeasure(int recurringTickCount) {

        ((fastestTickCounter % (numeratorSignature * denominatorSignature)) + 1) % fastestRateUpdate => int masterTick;

        [${Object.values(masterPatternsRef.current).map((i: any) =>  Object.values(i).map( (i:any) => i.fileNums.length > 0 ? `[${i.fileNums}]` : `['9999']` ) )}] @=> int filesArr[][]; 

        ${Object.values(valuesReadoutSampler).map((value: any) => value).join(' ')}
        

        if (recurringTickCount >= filesArr.size()) return;

        // --- Play all buffers in parallel
        if (recurringTickCount < filesArr.size()) {
            for (0 => int x; x <= filesArr[recurringTickCount].size() - 1; x++) {
                
                filesArr[recurringTickCount][x] => int fileIndex;
                
                if (fileIndex != 9999 && fileIndex < files.size() && x < buffers.size()) {
                    files[fileIndex] => buffers[x].read;
                    0 => buffers[x].pos;
                }
                    
            } 
        }
        beat => now;

        me.yield();
    }
    string result[];







    now => time startTimeMeasureLoop;
    beat / fastestRateUpdate => dur step; 


    spork ~ handlerFXUpdate(fxUpdate);


    // voice management
    int voiceBusy[128];
    for (0 => int i; i < numVoices; i++) 0 => voiceBusy[i];

    // helper: find a free voice
    fun int findFreeVoice() {
        for (0 => int i; i < numVoices; i++) {
            if (voiceBusy[i] == 0) return i;
        }
        return 0; // steal voice 0 if none free
    }

    Event noteOff[128]; // one per MIDI note

    int activeVoice[128];  // MIDI notes 0-127

    fun void handleRealtimeKeys() {
        while (true) {
            for (0 => int i; i < chuckNotes.cap(); i++) {
                Std.ftoi(chuckNotes[i]) => int noteIndex;

                if (activeVoice[noteIndex] == 0) {
                    findFreeVoice() => int v;
                    1 => voiceBusy[v];
                    v => activeVoice[noteIndex];
                    spork ~ playLiveNote(v, chuckNotes[i], chuckVelocities[i], noteIndex);
                }
            }
            10::ms => now;
        }
    }

    fun void playLiveNote(int v, float freq, float vel, int midiNoteIndex) {
        Std.mtof(freq) => voice[v].keyOn;
        vel => voice[v].gain;
        1 => adsr.keyOn;
        adsr.set((beatMS)::ms * moogGMDefaults["adsrAttack"], (beatMS)::ms * moogGMDefaults["adsrDecay"], moogGMDefaults["adsrSustain"], (beatMS)::ms * moogGMDefaults["adsrRelease"]);

        while (true) {
            0 => int stillHeld;
            for (0 => int i; i < chuckNotes.cap(); i++) {
                if (Std.ftoi(chuckNotes[i]) == midiNoteIndex) {
                    1 => stillHeld;
                }
            }
            if (stillHeld == 0) break;
            10::ms => now;
        }

        1 => voice[v].keyOff;
        0 => voiceBusy[v];
        0 => activeVoice[midiNoteIndex];
    }

    spork ~ handleRealtimeKeys();          // live play

    while(true)
    {
        ${Object.values(valuesReadout).map((value: any) => value).join(' ')}
        // ${Object.values(valuesReadoutSampler).map((value: any) => value).join(' ')}
        ${Object.values(valuesReadoutSTK).map((value: any) => value).join(' ')}
        ${Object.values(valuesReadoutAudioIn).map((value: any) => value).join(' ')}
 
        /////////////////////////////////////////////////////
        // THIS COULD BE SWITCHED FROM MONO BACK TO POLY...
        // for (0 => int i; i < testNotesArr.cap(); i++) {
        for (0 => int i; i < 1; i++) {
        


            (beatMS)::ms => dur durStep;

            
            
            0.3 / numVoices => voice[i].gain;
            // 1.0 => adsr.gain;

            adsr.set(durStep * moogGMDefaults["adsrAttack"], durStep * moogGMDefaults["adsrDecay"], moogGMDefaults["adsrSustain"], durStep * moogGMDefaults["adsrRelease"]);

            0.9 => adsr.gain;

            moogGMDefaults["cutoff"] => voice[i].cutoff;
            moogGMDefaults["rez"] => voice[i].rez;
            moogGMDefaults["env"] => voice[i].env;
            Std.ftoi(moogGMDefaults["oscType1"]) => voice[i].ChooseOsc1;
            Std.ftoi(moogGMDefaults["oscType2"]) => voice[i].ChooseOsc2;
            moogGMDefaults["detune"] => voice[i].detune;
            Std.ftoi(moogGMDefaults["oscOffset"]) => voice[i].oscOffset;
            moogGMDefaults["cutoffMod"] => voice[i].cutoffMod;
            moogGMDefaults["pitchMod"] => voice[i].pitchMod;
            Std.ftoi(moogGMDefaults["lfoVoice"]) => voice[i].ChooseLfo; // Lfo Voc
            // 0.5 => voice[i].filterLfo.gain;
            moogGMDefaults["offset"] => voice[i].offset;
            Std.ftoi(moogGMDefaults["lfoFreq"]) => voice[i].filterEnv;
            
            // Std.ftoi(moogGMDefaults["lfoFreq"]) => lfoFreqDefault;
            
            moogGMDefaults["noise"] => voice[i].noise;
            // 0.3 / numVoices => voice[i].gain;
        }
        ///////////////////////////////////////////////////



        (moogGMDefaults["limiterAttack"])::ms => limiter.attackTime; 
        moogGMDefaults["limiterThreshold"] => limiter.thresh;





        int recurringTickCount;

        if (fastestTickCounter > ${numeratorSignature * masterFastestRate * denominatorSignature}) {
            fastestTickCounter % ${numeratorSignature * masterFastestRate * denominatorSignature} => recurringTickCount;
        } else {
            fastestTickCounter => recurringTickCount;
        }

        <<< "SHREDCOUNT: ", Machine.numShreds(), recurringTickCount, beatMS >>>;


        if (now >= startTimeMeasureLoop + step) {
            
            <<< "TICK:", fastestTickCounter >>>; 

            spork ~ updateAudioMixerLevels();
       
            tickCounter + 1 => tickCounter;

            if (midiLengthsArray.cap() > 0) {
                spork ~ playProgrammaticNote(
                    midiLengthsArray[recurringTickCount],
                    midiFreqsArray[recurringTickCount],
                    midiVelocitiesArray[recurringTickCount]
                );    
                spork ~ handlerPlaySTK1(recurringTickCount, midiLengthsArray[recurringTickCount]);
            }

            spork ~ handlePlayDrumMeasure(recurringTickCount);

            fastestTickCounter + 1 => fastestTickCounter;                     
            step => now;     
        } 
        beatMS::ms => now;
        me.yield();

    }


    `;
    return newChuckCode;
}

export const noteToFreq = (note: string, octave: number): number => {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  // Normalize enharmonics and Unicode symbols
  const enharmonics: Record<string, string> = {
    "DB": "C#",
    "EB": "D#",
    "GB": "F#",
    "AB": "G#",
    "BB": "A#",
    "C♯": "C#",
    "D♯": "D#",
    "F♯": "F#",
    "G♯": "G#",
    "A♯": "A#",
    "C♭": "B",
    "D♭": "C#",
    "E♭": "D#",
    "G♭": "F#",
    "A♭": "G#",
    "B♭": "A#"
  };

  const cleanNote = note.toUpperCase().replace(/♯/g, "#").replace(/♭/g, "b");
  const normalized = enharmonics[cleanNote] || cleanNote;

  const index = names.indexOf(normalized);
  if (index === -1) {
    throw new Error(`Invalid note name: ${note}`);
  }

  const midi = (octave + 1) * 12 + index;
  const freq = 440.0 * Math.pow(2, (midi - 69) / 12);
  return freq;
};

export const flatToSharp = (oldKeyId: string) => {

    let newKeyId;

    if (oldKeyId.includes('b')) {
        if (oldKeyId.includes('A')) {
            newKeyId = 'G#'; 
        } else if (oldKeyId.includes('B')) {
            newKeyId = 'A#';
        } else if (oldKeyId.includes('D')) {
            newKeyId = 'C#';
        } else if (oldKeyId.includes('E')) {
            newKeyId = 'D#';
        } else if (oldKeyId.includes('G')) {
            newKeyId = 'F#';
        } else if (oldKeyId) {
            newKeyId = oldKeyId;
            if (oldKeyId !== "F" && oldKeyId !== "C") {
                console.log("what is this key?? ", oldKeyId);
            }
        }        
        console.log("FLAT TO SHARP: ", oldKeyId, "/// ", newKeyId);
    } else {
        newKeyId = oldKeyId;
    }


    return newKeyId;
};

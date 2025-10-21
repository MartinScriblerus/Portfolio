import * as BABYLON from '@babylonjs/core';

export const tryGetAudio = async () => {
  const devices = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  console.log('Audio devices:', devices);
};

const WEBCHUGIN_URL = "https://ccrma.stanford.edu/~tzfeng/static/webchugins/";

const chugins = [
    "ABSaturator.chug.wasm",
    "AmbPan.chug.wasm",
    "Binaural.chug.wasm",
    "Bitcrusher.chug.wasm",
    "Elliptic.chug.wasm",
    "ExpDelay.chug.wasm",
    "ExpEnv.chug.wasm",
    "FIR.chug.wasm",
    "FoldbackSaturator.chug.wasm",
    "GVerb.chug.wasm",
    "KasFilter.chug.wasm",
    "Ladspa.chug.wasm",
    "Line.chug.wasm",
    "MagicSine.chug.wasm",
    "Mesh2D.chug.wasm",
    "Multicomb.chug.wasm",
    "NHHall.chug.wasm",
    "Overdrive.chug.wasm",
    "PanN.chug.wasm",
    "Patch.chug.wasm",
    "Perlin.chug.wasm",
    "PitchTrack.chug.wasm",
    "PowerADSR.chug.wasm",
    "Random.chug.wasm",
    "Range.chug.wasm",
    "RegEx.chug.wasm",
    "Sigmund.chug.wasm",
    "Spectacle.chug.wasm",
    "WPDiodeLadder.chug.wasm",
    "WPKorg35.chug.wasm",
    "Wavetable.chug.wasm",
    "WinFuncEnv.chug.wasm",
    "XML.chug.wasm",
];

/**
 * Create paths to webchugins for loading into WebChucK
 * TODO: implement some kind of caching
 * @returns {string[]} array of chugin paths
 */
export function loadWebChugins(): string[] {
    return chugins.map((chuginName) => {
        return WEBCHUGIN_URL + chuginName;
    });
}

// Temporary stub to start ChucK intro; replace with real WebChucK integration later
// export function tryStartChucKIntro(bpm?: number) {
//   console.log('tryStartChucKIntro invoked', { bpm });
// }
export function makeLetterOverlay(scene: BABYLON.Scene, text: string, color: string) {
  const size = 256;
  const letterDT = new BABYLON.DynamicTexture(`letter-${text}-${color}-${Date.now()}`, { width: size, height: size }, scene, false);
  const lctx = letterDT.getContext();
  lctx.clearRect(0,0,size,size);
  lctx.font = 'bold 140px sans-serif';
  (lctx as CanvasRenderingContext2D).textAlign = 'center';
  (lctx as CanvasRenderingContext2D).textBaseline = 'middle';
  lctx.fillStyle = color;
  lctx.fillText(text, size/2, size/2);
  letterDT.hasAlpha = true;
  letterDT.update();
  return letterDT;
}

export const smoothAvg = { r:0, g:0, b:0, energy:0 };
export const SMOOTH_ALPHA = 0.08; // lower = smoother (more temporal damping for calmer background)
export let isPast30 = false;

export function applySmoothing(smoothAvg: {r: number; g: number; b: number; energy: number}, currentAvg: {r: number; g: number; b: number; energy: number}, SMOOTH_ALPHA: number) {
    smoothAvg.r += (currentAvg.r - smoothAvg.r) * SMOOTH_ALPHA;
    smoothAvg.g += (currentAvg.g - smoothAvg.g) * SMOOTH_ALPHA;
    smoothAvg.b += (currentAvg.b - smoothAvg.b) * SMOOTH_ALPHA;
    smoothAvg.energy += (currentAvg.energy - smoothAvg.energy) * SMOOTH_ALPHA;
    return smoothAvg;
};

export const audioInEffectSlidersHelper = (selected: string) => {
    switch (selected) {
        case 'Grain':
            return [
                {
                    name: 'Stretch',
                    keyname: 'grain_stretch',
                    max: 50.0,
                    min: 0,
                    default: 10.0,
                    type: 'int'
                }, 
                {
                    name: 'Rate',
                    keyname: 'grain_rate',
                    max: 0.5,
                    min: -10.0,
                    default: 1.0,
                    type: 'float'
                }, 
                {
                    name: 'Length',
                    keyname: 'grain_length',
                    max: 10000.0,
                    min: 1.0,
                    default: 1000.0,
                    type: 'int'
                }, 
                {
                    name: 'Max Length',
                    keyname: 'grain_maxlength',
                    max: 10.0,
                    min: 1.0,
                    default: 8.0,
                    type: 'int'
                }, 
                {
                    name: 'Grains',
                    keyname: 'grain_grains',
                    max: 200.0,
                    min: 1.0,
                    default: 100.0,
                    type: 'int'
                }, 
            ];
        case 'Tape':
            return [
                {
                    name: 'Delay Length',
                    keyname: 'tape_delaylength',
                    max: 2000.0,
                    min: 1.0,
                    default: 500.0,
                    type: 'int'
                }, 
                {
                    name: 'Loop',
                    keyname: 'tape_loop',
                    max: 1.0,
                    min: 0.0,
                    default: 1.0,
                    type: 'int'
                }, 
                {
                    name: 'Gain',
                    keyname: 'tape_gain',
                    max: 2.0,
                    min: 0.0,
                    default:0.5,
                    type: 'float'
                }, 
            ];
        case 'Random Reverse':
            return [
                {
                    name: 'Influence',
                    keyname: 'random_reverse_influence',
                    max: 5.0,
                    min: 0.0,
                    default: 0.8,
                    type: 'float'
                }, 
                {
                    name: 'Reverse Gain',
                    keyname: 'random_reverse_reversegain',
                    max: 5.0,
                    min: 0.0,
                    default: 3.9,
                    type: 'float'
                }, 
                {
                    name: 'MaxBuffer Length',
                    keyname: 'random_reverse_maxbufferlength',
                    max: 10000.0,
                    min: 1.0,
                    default: 5000.0,
                    type: 'int'
                }, 
                {
                    name: 'Envelope Duration',
                    keyname: 'random_reverse_envelopeduration',
                    max: 10000.0,
                    min: 1.0,
                    default: 2000.0,
                    type: 'int'
                }, 
                {
                    name: 'Maxtime Between',
                    keyname: 'random_reverse_maxtimebetween',
                    max: 5000.0,
                    min: 1.0,
                    default: 1000.0,
                    type: 'int'
                }, 
            ];
        case 'Clapping':
            return [
                {
                    name: 'Record',
                    keyname: 'clapping_record',
                    max: 1.0,
                    min: 0.0,
                    default: 1.0,
                    type: 'int'
                }, 
                {
                    name: 'Play',
                    keyname: 'clapping_play',
                    max: 1.0,
                    min: 0.0,
                    default: 1.0,
                    type: 'int'
                }, 
                {
                    name: 'Length',
                    keyname: 'clapping_length',
                    max: 10000.0,
                    min: 1.0,
                    default: 100.0,
                    type: 'int'
                },
                {
                    name: 'Voices',
                    keyname: 'clapping_voices',
                    max: 200.0,
                    min: 1.0,
                    default: 4.0,
                    type: 'int'
                }, 
                {
                    name: 'Speed',
                    keyname: 'clapping_speed',
                    max: 2000.0,
                    min: 0.0,
                    default: 1001.0,
                    type: 'float'
                },
                {
                    name: 'Bi',
                    keyname: 'clapping_bi',
                    max: 1.0,
                    min: 0.0,
                    default: 0.0,
                    type: 'int'
                }, 
                {
                    name: 'Random',
                    keyname: 'clapping_random',
                    max: 1.0,
                    min: 0.0,
                    default: 1.0,
                    type: 'int'
                }, 
                {
                    name: 'Spread',
                    keyname: 'clapping_spread',
                    max: 1.0,
                    min: 0.0,
                    default: 0.0,
                    type: 'int'
                }, 
                {
                    name: 'MaxBuffer Multiplier',
                    keyname: 'clapping_maxbuffermultiplier',
                    max: 16.0,
                    min: 0.0,
                    default: 8.0,
                    type: 'float'
                }, 
            ];
        case 'Lisa Trigger':
            return [
                {
                    name: 'Listen',
                    keyname: 'lisa_trigger_listen',
                    max: 1.0,
                    min: 0.0,
                    default: 0.0,
                    type: 'int'
                }, 
                {
                    name: 'Length',
                    keyname: 'lisa_trigger_length',
                    max: 10000.0,
                    min: 1.0,
                    default: 1000.0,
                    type: 'int'
                },   
                {
                    name: 'MinLength',
                    keyname: 'lisa_trigger_minlength',
                    max: 2000.0,
                    min: 1.0,
                    default: 250.0,
                    type: 'int'
                }, 
                {
                    name: 'Ramp Up',
                    keyname: 'lisa_trigger_rampup',
                    max: 8.0,
                    min: 0.0,
                    default: 2.0,
                    type: 'int'
                }, 
                {
                    name: 'Ramp Down',
                    keyname: 'lisa_trigger_rampdown',
                    max: 8.0,
                    min: 0.0,
                    default: 2.0,
                    type: 'int'
                }, 
                {
                    name: 'Rate',
                    keyname: 'lisa_trigger_rate',
                    max: 10.0,
                    min: -10.0,
                    default: -1.25,
                    type: 'float'
                }, 
                {
                    name: 'Buffer Window',
                    keyname: 'lisa_trigger_bufferwindow',
                    max: 4.0,
                    min: 0.1,
                    default: 0.5,
                    type: 'float'
                }, 
                {
                    name: 'Env Window',
                    keyname: 'lisa_trigger_envwindow',
                    max: 4.0,
                    min: 0.1,
                    default: 2.0,
                    type: 'float'
                },   
            ];
        case 'Asymptotic Chopper':
            return [
                {
                    name: 'Listen',
                    keyname: 'asymptotic_chopper_listen',
                    max: 1.0,
                    min: 0.0,
                    default: 0.0,
                    type: 'int'
                }, 
                                {
                    name: 'Length',
                    keyname: 'asymptotic_chopper_length',
                    max: 5000.0,
                    min: 1.0,
                    default: 100.0,
                    type: 'int'
                }, 
                                {
                    name: 'MinLength Divisor',
                    keyname: 'asymptotic_chopper_minlengthdivisor',
                    max: 100.0,
                    min: 1.0,
                    default: 40.0,
                    type: 'float'
                }, 
                                {
                    name: 'MaxLength Multiplier',
                    keyname: 'asymptotic_chopper_maxlengthmultiplier',
                    max: 100.0,
                    min: 1.0,
                    default: 10.0,
                    type: 'float'
                }, 
                {
                    name: 'Env Window',
                    keyname: 'asymptotic_chopper_envwindow',
                    max: 100.0,
                    min: 0.01,
                    default: 0.5,
                    type: 'float'
                }, 
            ];
        // case 'Mosaic Synth':
        //     return [''];
        default:
            return [];
    }
};


import * as BABYLON from '@babylonjs/core';
import { HexNote, LayoutPreset } from '../interfaces/interfaces';

// export const tryGetAudio = async () => {
//   const devices = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
//   console.log('Audio devices:', devices);
// };

// const WEBCHUGIN_URL = "https://ccrma.stanford.edu/~tzfeng/static/webchugins/";

// const chugins = [
//     "ABSaturator.chug.wasm",
//     "AmbPan.chug.wasm",
//     "Binaural.chug.wasm",
//     "Bitcrusher.chug.wasm",
//     "Elliptic.chug.wasm",
//     "ExpDelay.chug.wasm",
//     "ExpEnv.chug.wasm",
//     "FIR.chug.wasm",
//     "FoldbackSaturator.chug.wasm",
//     "GVerb.chug.wasm",
//     "KasFilter.chug.wasm",
//     "Ladspa.chug.wasm",
//     "Line.chug.wasm",
//     "MagicSine.chug.wasm",
//     "Mesh2D.chug.wasm",
//     "Multicomb.chug.wasm",
//     "NHHall.chug.wasm",
//     "Overdrive.chug.wasm",
//     "PanN.chug.wasm",
//     "Patch.chug.wasm",
//     "Perlin.chug.wasm",
//     "PitchTrack.chug.wasm",
//     "PowerADSR.chug.wasm",
//     "Random.chug.wasm",
//     "Range.chug.wasm",
//     "RegEx.chug.wasm",
//     "Sigmund.chug.wasm",
//     "Spectacle.chug.wasm",
//     "WPDiodeLadder.chug.wasm",
//     "WPKorg35.chug.wasm",
//     "Wavetable.chug.wasm",
//     "WinFuncEnv.chug.wasm",
//     "XML.chug.wasm",
// ];

// let displayDigits: number = 0; // e.g. 5 in 44100
// /**
//  * Calculate the number of digits to display for a sample rate
//  * @param sampleRate The sample rate
//  */
// export function calculateDisplayDigits(sampleRate: number) {
//     displayDigits = (Math.log(sampleRate) * Math.LOG10E + 1) | 0;
// }

/**
 * Create paths to webchugins for loading into WebChucK
 * TODO: implement some kind of caching
 * @returns {string[]} array of chugin paths
 */
// export function loadWebChugins(): string[] {
//     return chugins.map((chuginName) => {
//         return WEBCHUGIN_URL + chuginName;
//     });
// }

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
    switch (selected.toLowerCase()) {
        case 'grain':
            return [
                // {
                //     name: 'Stretch',
                //     keyname: 'grain_stretch',
                //     max: 1.0,
                //     min: 0.0,
                //     default: 1.0,
                //     type: 'int'
                // }, 
                {
                    name: 'Rate',
                    keyname: 'grain_rate',
                    max: 2000.0,
                    min: -2000.0,
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
                // {
                //     name: 'Max Length',
                //     keyname: 'grain_maxlength',
                //     max: 600.0,
                //     min: 1.0,
                //     default: 8.0,
                //     type: 'int'
                // }, 
                {
                    name: 'Grains',
                    keyname: 'grain_grains',
                    max: 200.0,
                    min: 1.0,
                    default: 100.0,
                    type: 'int'
                }, 
            ];
        case 'tape':
            return [
                {
                    name: 'Delay Length',
                    keyname: 'tape_delaylength',
                    max: 600.0,
                    min: 1.0,
                    default: 200.0,
                    type: 'int'
                }, 
                // {
                //     name: 'Loop',
                //     keyname: 'tape_loop',
                //     max: 1.0,
                //     min: 0.0,
                //     default: 1.0,
                //     type: 'int'
                // }, 
                {
                    name: 'Gain',
                    keyname: 'tape_gain',
                    max: 800.0,
                    min: 0.0,
                    default:300.0,
                    type: 'float'
                }, 
            ];
        case 'random reverse':
            return [
                {
                    name: 'Influence',
                    keyname: 'random_reverse_influence',
                    max: 1000.0,
                    min: 0.0,
                    default: 500.0,
                    type: 'float'
                }, 
                {
                    name: 'MaxBuffer Length',
                    keyname: 'random_reverse_maxbufferlength',
                    max: 600.0,
                    min: 1.0,
                    default: 200.0,
                    type: 'int'
                }, 
                {
                    name: 'Envelope Duration',
                    keyname: 'random_reverse_envelopeduration',
                    max: 10000.0,
                    min: 1.0,
                    default: 5000.0,
                    type: 'int'
                }, 
                {
                    name: 'Rate',
                    keyname: 'random_reverse_rate',
                    max: 2000.0,
                    min: -2000.0,
                    default: -1000.0,
                    type: 'float'
                }, 
            ];
        case 'clapping':
            return [
                {
                    name: 'Length',
                    keyname: 'clapping_length',
                    max: 10000.0,
                    min: 0.0,
                    default: 0.0,
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
                    min: -2000.0,
                    default: 1001.0,
                    type: 'float'
                },
                {
                    name: 'MaxBuffer',
                    keyname: 'clapping_maxbuffer',
                    max: 10000.0,
                    min: 0.0,
                    default: 8.0,
                    type: 'float'
                }, 
            ];
        case 'Lisa Trigger':
            return [
                // {
                //     name: 'Listen',
                //     keyname: 'lisa_trigger_listen',
                //     max: 1.0,
                //     min: 0.0,
                //     default: 0.0,
                //     type: 'int'
                // }, 
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
                    max: 2000.0,
                    min: -1000.0,
                    default: 250.0,
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
                // {
                //     name: 'Listen',
                //     keyname: 'asymptotic_chopper_listen',
                //     max: 1.0,
                //     min: 0.0,
                //     default: 0.0,
                //     type: 'int'
                // }, 
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
        case 'Mosaic Synth':
            return [
                {
                    name: 'Voices',
                    keyname: 'mosaic_voices',
                    max: 32.0,
                    min: 1.0,
                    default: 16.0,
                    type: 'int'
                },
                {
                    name: 'Window Length',
                    keyname: 'mosaic_windowlength',
                    max: 4.0,
                    min: 0.1,
                    default: 0.5,
                    type: 'float'
                }
            ];
        default:
            return [];
    }
};

// (reverted) No axial mapping; original polar/spiral placement preserved below in generateHexGrid.

/**
 * Generate an isomorphic hex layout using axial coordinates.
 * - q steps correspond to vector1.interval semitones
 * - r steps correspond to vector2.interval semitones
 * We fill a hexagonal region of radius R large enough to include numNotes pitches starting from 0.
 */
export function generateHexGrid(
    preset: LayoutPreset,
    numNotes: number,
    stepsPerOctave: number
): HexNote[] {
    const { vector1, vector2 } = preset;
    const hexes: HexNote[] = [];

    for (let i = 0; i < numNotes; i++) {
        const m = Math.floor(i / stepsPerOctave);
        const n = i % stepsPerOctave;

        const xGrid = m * vector1.dx + n * vector2.dx;
        const yGrid = m * vector1.dy + n * vector2.dy;

        // convert to radial spiral coordinates (original behavior)
        const radius = 1 + 0.5 * (m + n);
        const angle = (2 * Math.PI / stepsPerOctave) * (xGrid + yGrid);

        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const z = radius * 0.1; // subtle spiral depth

        hexes.push({ x, y, z, pitchIndex: i % stepsPerOctave });
    }

    return hexes;
}

// Axial hex grid generator (pointy-top) that lays out an isomorphic keyboard using preset intervals.
// Positions are on a flat XY board; Z stays 0. Size controls spacing (default 1.0); caller sets visual radius.
export function generateHexGridAxial(
    preset: LayoutPreset,
    numNotes: number,
    stepsPerOctave: number,
    opts?: { cellSize?: number; radiusRings?: number; centerPitch?: number }
): HexNote[] {
    const { vector1, vector2 } = preset;
    const hexes: HexNote[] = [];
    const size = opts?.cellSize ?? 1.0;
    // Minimal rings to cover target count (hex number formula)
    let R = opts?.radiusRings ?? 0;
    if (R <= 0) { while (1 + 3 * R * (R + 1) < numNotes) R++; }
    const origin = opts?.centerPitch ?? 0;

    for (let q = -R; q <= R; q++) {
        for (let r = -R; r <= R; r++) {
            const s = -q - r;
            if (Math.abs(q) + Math.abs(r) + Math.abs(s) > 2 * R) continue;
            const pitch = origin + q * vector1.interval + r * vector2.interval;
            const x = size * Math.sqrt(3) * (q + r / 2);
            const y = size * 1.5 * r;
            // XY board (z=0). Tiles are later rotated to face the camera while staying coplanar.
            hexes.push({ x, y, z: 0, pitchIndex: ((pitch % stepsPerOctave) + stepsPerOctave) % stepsPerOctave, absStep: pitch });
        }
    }
    // Stable ordering: nearest to origin first
    hexes.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
    return hexes.slice(0, numNotes);
}

export function createHexMesh(
    scene: BABYLON.Scene,
    radius: number,
    hex: HexNote,
    color: string,
    label?: string | { main: string; sub?: string }
) {
    // Create a true hex polygon (disc with 6 segments). Use FRONTSIDE to avoid mirrored backfaces.
    // Keep tiles on XY plane, visible from either side to avoid culling when camera orbits.
    const mesh = BABYLON.MeshBuilder.CreateDisc("hex", { radius, tessellation: 6, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    mesh.position.set(hex.x, hex.y, hex.z);
    mesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_NONE; // keep all tiles coplanar
    // No extra rotation: default disc normal +Z keeps board aligned with camera

    const mat = new BABYLON.StandardMaterial("hexMat", scene);

    // If we have a label, draw the colored background + label directly into a dynamic texture
    // so the text is guaranteed visible. Otherwise, just tint with the color.
    if (label) {
        const size = 256;
        const dt = new BABYLON.DynamicTexture(`hex-label-${label}-${Date.now()}`,
            { width: size, height: size }, scene, false);
        const ctx = dt.getContext();
        ctx.clearRect(0, 0, size, size);
        // fill background with tile color
        try {
            ctx.fillStyle = color;
        } catch {
            ctx.fillStyle = '#666';
        }
        ctx.fillRect(0, 0, size, size);
        // choose contrasting text color
        const c3 = (() => {
            try { return BABYLON.Color3.FromHexString(color); } catch { return new BABYLON.Color3(0.5,0.5,0.5); }
        })();
        const luminance = 0.2126 * c3.r + 0.7152 * c3.g + 0.0722 * c3.b;
        const textColor = luminance > 0.55 ? '#111' : '#fff';
        const canvas2d = ctx as CanvasRenderingContext2D;
        canvas2d.textAlign = 'center';
        canvas2d.textBaseline = 'middle';
        ctx.fillStyle = textColor;

        const renderTwoLine = (main: string, sub?: string) => {
            // Base target widths
            const maxW = size * 0.8;
            // Adaptive font sizes
            let mainPx = Math.floor(size * 0.38);
            let subPx = Math.floor(size * 0.22);

            // Fit main within maxW
            ctx.font = `bold ${mainPx}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
            let metrics = ctx.measureText(main);
            if (metrics.width > maxW) {
                mainPx = Math.max(24, Math.floor(mainPx * (maxW / metrics.width)));
                ctx.font = `bold ${mainPx}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
            }
            const yMain = sub ? size * 0.44 : size * 0.52;
            ctx.fillText(main, size/2, yMain);

            if (sub) {
                ctx.font = `600 ${subPx}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
                metrics = ctx.measureText(sub);
                if (metrics.width > maxW) {
                    subPx = Math.max(18, Math.floor(subPx * (maxW / metrics.width)));
                    ctx.font = `600 ${subPx}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
                }
                const ySub = size * 0.74;
                ctx.fillText(sub, size/2, ySub);
            }
        };

        if (typeof label === 'string') {
            renderTwoLine(label);
        } else {
            renderTwoLine(label.main, label.sub);
        }
        dt.hasAlpha = true;
        dt.update();
        mat.diffuseTexture = dt;
        // Flip vertically so text appears upright after mesh rotation
        // ensure the texture colors show as-is
        // No vertical flip needed with default orientation
        mat.diffuseColor = new BABYLON.Color3(1,1,1);
        // small emissive to keep labels readable in low light
        mat.emissiveColor = new BABYLON.Color3(0.1,0.1,0.1);
    } else {
        // no label: simple colored face
        mat.diffuseColor = BABYLON.Color3.FromHexString(color);
    }

    mesh.material = mat;
    mesh.isPickable = true;

    // Hover highlight
    mesh.actionManager = new BABYLON.ActionManager(scene);
    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
            mat.emissiveColor = BABYLON.Color3.Yellow();
        })
    );
    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
            // restore subtle emissive if we drew a label; otherwise black
            mat.emissiveColor = label ? new BABYLON.Color3(0.1,0.1,0.1) : BABYLON.Color3.Black();
        })
    );

    return mesh;
}

// --- Note label formatting ---
// Generates human-readable labels for pitch steps.
// - For 12-TET: standard note names with sharps or flats and root transpose
// - For generic N-TET: returns "n/N" (step index within the octave)
export function formatNoteLabel(
    pitchIndex: number,
    stepsPerOctave: number,
    opts?: { root?: number; mode?: '12-sharp' | '12-flat' | 'generic' }
): string {
    const root = opts?.root ?? 0; // semitone offset (0=C in 12-TET)
    const mode = opts?.mode ?? (stepsPerOctave === 12 ? '12-sharp' : 'generic');
    const step = ((pitchIndex % stepsPerOctave) + stepsPerOctave) % stepsPerOctave;
    if (stepsPerOctave === 12 && (mode === '12-sharp' || mode === '12-flat')) {
        const namesSharp = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
        const namesFlat  = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
        const table = mode === '12-sharp' ? namesSharp : namesFlat;
        const idx = ((step + root) % 12 + 12) % 12;
        return table[idx];
    }
    // Generic N-TET fallback: show index within the octave
    return `${step}/${stepsPerOctave}`;
}

// Format a musical note name with octave from an arbitrary EDO step by projecting to the nearest 12‑TET semitone.
// baseMidi = MIDI note for step 0 (defaults to C4 = 60)
export function formatNoteNameWithOctave(
    absStep: number,
    stepsPerOctave: number,
    opts?: { baseMidi?: number; sharps?: boolean }
): string {
    const baseMidi = opts?.baseMidi ?? 60; // C4
    const sharps = opts?.sharps ?? true;
    // Approximate semitone distance
    const semis = Math.round((absStep * 12) / stepsPerOctave);
    const midi = baseMidi + semis;
    const namesSharp = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
    const namesFlat  = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
    const nameTbl = sharps ? namesSharp : namesFlat;
    const name = nameTbl[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1; // MIDI octave formula
    return `${name}${octave}`;
}

// Map a pitch step to frequency using equal temperament.
// f = baseFreq * 2^((step - baseStep)/stepsPerOctave)
// By default, treats step 0 as C4 (~261.6256 Hz).
export function pitchToFrequency(
    step: number,
    stepsPerOctave: number,
    ref?: { baseFreq?: number; baseStep?: number }
): number {
    const baseFreq = ref?.baseFreq ?? 261.625565; // C4
    const baseStep = ref?.baseStep ?? 0;
    return baseFreq * Math.pow(2, (step - baseStep) / stepsPerOctave);
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

// import { DeferredPromise } from "webchuck";

/*
 * Types:
 *   Filename
 *   File
 *
 * Functions:
 *   asyncLoadFile
 *   preloadFiles
 *   defer
 */
//   export interface Filename {
//       serverFilename: string;
//       virtualFilename: string;
//   }
//   export interface File {
//     filename: string;
//     data?: ArrayBuffer;
//   }

  export const disposeBabylonResources = (scene: any) => {
      // Dispose of all meshes
      scene.meshes.forEach((mesh: any) => {
          mesh.dispose();
      });
  
      // Dispose of all materials
      scene.materials.forEach((material: any) => {
          material.dispose();
      });
  
      // Dispose of all textures
      scene.textures.forEach((texture: any) => {
          texture.dispose();
      });
  
      // Dispose of cameras
      scene.cameras.forEach((camera: any) => {
          camera.dispose();
      });
  
      // Dispose of lights
      scene.lights.forEach((light: any) => {
          light.dispose();
      });
  };
  
  
//   function readAsync(
//     url: string,
//     onload: (buffer: ArrayBuffer) => void,
//     onerror: () => void
//   ): void {
//     const xhr = new XMLHttpRequest();
//     xhr.open("GET", url, true);
//     xhr.responseType = "arraybuffer";
//     xhr.onload = () => {
//       if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
//         onload(xhr.response);
//       } else {
//         onerror();
//       }
//     };
//     xhr.onerror = onerror;
//     xhr.send(null);
//   }
  
//   export function asyncLoadFile(
//     url: string,
//     onload: (buffer: ArrayBuffer) => void,
//     onerror: () => void
//   ): void {
//     readAsync(
//       url,
//       (arrayBuffer: ArrayBuffer) => {
//         // TODO: do we need Uint8Array here?
//         onload(arrayBuffer);
//       },
//       () => {
//         if (onerror) {
//           onerror();
//         } else {
//           throw new Error(`Loading data file ${url} failed.`);
//         }
//       }
//     );
//   }
  
//   export async function preloadFiles(
//     filenamesToPreload: Filename[]
//   ): Promise<File[]> {
//     console.log("is this a thing??? ", filenamesToPreload); 
//     const promises = filenamesToPreload.map(
//       (filenameToPreload) =>
//         new Promise<File>((resolve, _reject) => {
//           asyncLoadFile(
//             filenameToPreload.serverFilename,
//             (byteArray) => {
//               resolve({
//                 filename: filenameToPreload.virtualFilename,
//                 data: byteArray,
//               });
//             },
//             () => {
//               console.error(
//                 `Error fetching file: ${filenameToPreload.serverFilename}`
//               );
//             }
//           );
//         })
//     );
//     return await Promise.all(promises);
//   }
  
//   export async function loadWasm(): Promise<ArrayBuffer> {
//     return await new Promise((resolve, reject) => {
//       asyncLoadFile(
//         // "https://chuck.stanford.edu/webchuck/src/webchuck.wasm",
//         `../../src/webchuck.wasm`,
//         resolve,
//         reject
//       );
//     });
//   }
  


  export const getConvertedRadio = (fxRadioValue: string) => fxRadioValue === "STK" ? "stk1" : fxRadioValue === "audioin" ? "audioin" : fxRadioValue ? fxRadioValue.toLowerCase() : "";